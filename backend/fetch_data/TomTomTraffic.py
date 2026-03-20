"""
TomTom Traffic Incidents API Integration
Fetches real-time traffic incidents for route safety analysis
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import httpx
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter()

TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")

# TomTom incident categories with severity weights
INCIDENT_CATEGORIES = {
    0: {"name": "Unknown", "severity": 1},
    1: {"name": "Accident", "severity": 5},
    2: {"name": "Fog", "severity": 2},
    3: {"name": "DangerousConditions", "severity": 4},
    4: {"name": "Rain", "severity": 2},
    5: {"name": "Ice", "severity": 4},
    6: {"name": "Jam", "severity": 3},
    7: {"name": "LaneClosed", "severity": 3},
    8: {"name": "RoadClosed", "severity": 5},
    9: {"name": "RoadWorks", "severity": 2},
    10: {"name": "Wind", "severity": 2},
    11: {"name": "Flooding", "severity": 5},
    14: {"name": "BrokenDownVehicle", "severity": 3}
}


async def _fetch_incidents_internal(bbox: str, category_filter: Optional[str] = None):
    """
    Internal function to fetch traffic incidents (not a route handler)
    
    Args:
        bbox: Bounding box coordinates (minLon,minLat,maxLon,maxLat)
        category_filter: Optional filter for specific incident categories
    
    Returns:
        List of traffic incidents with location and severity data
    """
    if not TOMTOM_API_KEY:
        raise HTTPException(status_code=500, detail="TomTom API key not configured")
    
    try:
        # Parse bounding box
        coords = bbox.split(',')
        if len(coords) != 4:
            raise HTTPException(status_code=400, detail="Invalid bounding box format")
        
        min_lon, min_lat, max_lon, max_lat = map(float, coords)
        
        # Build TomTom API URL
        # Using Traffic Incident Details API v5
        base_url = "https://api.tomtom.com/traffic/services/5/incidentDetails"
        
        params = {
            "key": TOMTOM_API_KEY,
            "bbox": f"{min_lon},{min_lat},{max_lon},{max_lat}",
            "fields": "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity}}}",
            "language": "en-US",
            "timeValidityFilter": "present"
        }
        
        # Only add categoryFilter if provided
        if category_filter:
            params["categoryFilter"] = category_filter
        
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(base_url, params=params)
            response.raise_for_status()
            data = response.json()
        
        # Process and enrich incident data
        incidents = []
        if "incidents" in data:
            for incident in data["incidents"]:
                properties = incident.get("properties", {})
                icon_category = properties.get("iconCategory", 0)
                
                # Get incident category info
                category_info = INCIDENT_CATEGORIES.get(icon_category, INCIDENT_CATEGORIES[0])
                
                incidents.append({
                    "id": properties.get("id"),
                    "type": incident.get("type"),
                    "geometry": incident.get("geometry"),
                    "category": icon_category,
                    "category_name": category_info["name"],
                    "severity": category_info["severity"],
                    "magnitude_of_delay": properties.get("magnitudeOfDelay", 0),
                    "delay": properties.get("delay", 0),
                    "length": properties.get("length", 0),
                    "from": properties.get("from"),
                    "to": properties.get("to"),
                    "road_numbers": properties.get("roadNumbers", []),
                    "description": properties.get("events", [{}])[0].get("description", ""),
                    "start_time": properties.get("startTime"),
                    "end_time": properties.get("endTime")
                })
        
        return {
            "success": True,
            "count": len(incidents),
            "incidents": incidents
        }
    
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"TomTom API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching traffic incidents: {str(e)}")


@router.get("/api/traffic/incidents")
async def get_traffic_incidents(
    bbox: str = Query(..., description="Bounding box: minLon,minLat,maxLon,maxLat"),
    category_filter: Optional[str] = Query(None, description="Comma-separated incident categories")
):
    """
    Fetch traffic incidents within a bounding box
    
    Args:
        bbox: Bounding box coordinates (minLon,minLat,maxLon,maxLat)
        category_filter: Optional filter for specific incident categories
    
    Returns:
        List of traffic incidents with location and severity data
    """
    return await _fetch_incidents_internal(bbox, category_filter)


def _point_to_line_distance(point, line_start, line_end):
    """
    Calculate the shortest distance from a point to a line segment
    
    Args:
        point: [lon, lat]
        line_start: [lon, lat]
        line_end: [lon, lat]
    
    Returns:
        Distance in degrees (approximate)
    """
    px, py = point
    x1, y1 = line_start
    x2, y2 = line_end
    
    # Calculate line segment length squared
    line_len_sq = (x2 - x1) ** 2 + (y2 - y1) ** 2
    
    if line_len_sq == 0:
        # Line segment is a point
        return ((px - x1) ** 2 + (py - y1) ** 2) ** 0.5
    
    # Calculate projection of point onto line segment (clamped to [0, 1])
    t = max(0, min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / line_len_sq))
    
    # Find closest point on line segment
    closest_x = x1 + t * (x2 - x1)
    closest_y = y1 + t * (y2 - y1)
    
    # Return distance
    return ((px - closest_x) ** 2 + (py - closest_y) ** 2) ** 0.5


def _incident_intersects_route(incident_geometry, route_coordinates, threshold_degrees=0.0005):
    """
    Check if an incident intersects with the route
    
    Args:
        incident_geometry: Incident geometry (Point or LineString)
        route_coordinates: Route coordinates [[lon, lat], ...]
        threshold_degrees: Distance threshold in degrees (~50 meters at equator)
    
    Returns:
        Boolean indicating if incident affects the route
    """
    if not incident_geometry or not route_coordinates:
        return False
    
    geom_type = incident_geometry.get("type")
    incident_coords = incident_geometry.get("coordinates", [])
    
    if not incident_coords:
        return False
    
    # Convert incident to list of points to check
    points_to_check = []
    
    if geom_type == "Point":
        points_to_check = [incident_coords]
    elif geom_type == "LineString":
        points_to_check = incident_coords
    elif geom_type == "MultiPoint":
        points_to_check = incident_coords
    else:
        # Unsupported geometry type
        return False
    
    # Check if any incident point is close to any route segment
    for point in points_to_check:
        for i in range(len(route_coordinates) - 1):
            distance = _point_to_line_distance(
                point,
                route_coordinates[i],
                route_coordinates[i + 1]
            )
            
            if distance <= threshold_degrees:
                return True
    
    return False


@router.post("/api/traffic/route-incidents")
async def get_route_incidents(route_data: dict):
    """
    Analyze traffic incidents along a specific route
    
    Args:
        route_data: Dictionary containing route geometry (LineString coordinates)
    
    Returns:
        Incidents affecting the route with segment information
    """
    if not TOMTOM_API_KEY:
        raise HTTPException(status_code=500, detail="TomTom API key not configured")
    
    try:
        coordinates = route_data.get("coordinates", [])
        if not coordinates:
            raise HTTPException(status_code=400, detail="No route coordinates provided")
        
        # Calculate bounding box from route coordinates
        lons = [coord[0] for coord in coordinates]
        lats = [coord[1] for coord in coordinates]
        
        # Add buffer (approximately 1km in degrees)
        buffer = 0.01
        min_lon = min(lons) - buffer
        max_lon = max(lons) + buffer
        min_lat = min(lats) - buffer
        max_lat = max(lats) + buffer
        
        bbox = f"{min_lon},{min_lat},{max_lon},{max_lat}"
        
        # Fetch incidents in the route area using internal function
        incidents_response = await _fetch_incidents_internal(bbox=bbox, category_filter=None)
        all_incidents = incidents_response["incidents"]
        
        # Filter incidents to only those that actually intersect the route
        incidents = [
            inc for inc in all_incidents
            if _incident_intersects_route(inc.get("geometry"), coordinates)
        ]
        
        # Calculate total severity score for the route
        total_severity = sum(inc["severity"] for inc in incidents)
        
        # Count incidents by category
        category_counts = {}
        for inc in incidents:
            cat_name = inc["category_name"]
            category_counts[cat_name] = category_counts.get(cat_name, 0) + 1
        
        return {
            "success": True,
            "route_length": len(coordinates),
            "incident_count": len(incidents),
            "total_severity_score": total_severity,
            "category_counts": category_counts,
            "incidents": incidents
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing route incidents: {str(e)}")
