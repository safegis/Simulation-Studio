# BEFORE: This was a standalone FastAPI server with its own app instance
# AFTER: This now contains only API route definitions to be imported by main.py

import os
import time
import gzip
import asyncio
import httpx
from fastapi import Query, Response
from dotenv import load_dotenv
from datetime import datetime
from .HazardScraper import get_latest_data, get_latest_tsunami_data

# Load environment variables (.env in project root or cwd)
load_dotenv()

GEOAPIFY_API_KEY = os.getenv("NEXT_PUBLIC_GEOAPIFY_API_KEY")
MAPBOX_TOKEN = os.getenv("NEXT_PUBLIC_MAPBOX_TOKEN")
TOMTOM_API_KEY = os.getenv("NEXT_PUBLIC_TOMTOM_API_KEY")

if not GEOAPIFY_API_KEY:
    raise RuntimeError("Missing NEXT_PUBLIC_GEOAPIFY_API_KEY.")
if not MAPBOX_TOKEN:
    raise RuntimeError("Missing NEXT_PUBLIC_MAPBOX_TOKEN.")
if not TOMTOM_API_KEY:
    raise RuntimeError("Missing NEXT_PUBLIC_TOMTOM_API_KEY.")

# -----------------------
# Cache config for Active Faults
# -----------------------
CACHE_TTL = 3600  # seconds
_active_faults_cache = None
_active_faults_cache_time = 0
SUPABASE_ACTIVE_FAULTS_URL = (
    "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/"
    "Static%20Hazard%20Maps/Active%20Faults/gem_active_faults_harmonized.geojson"
)

# -----------------------
# API Route Functions
# -----------------------

async def get_earthquakes(feed: str = "all_day"):
    """
    Proxy to USGS Earthquake GeoJSON feed.
    feed: all_day, all_week, significant_day, etc.
    """
    url = f"https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/{feed}.geojson"
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.json()

async def get_volcanoes():
    """
    Proxy to USGS Volcano API.
    """
    url = "https://volcanoes.usgs.gov/vsc/api/volcanoApi/volcanoesGVP"
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.json()

async def get_active_faults():
    """
    Cached + Gzipped Active Faults data from Supabase.
    """
    global _active_faults_cache, _active_faults_cache_time

    # Serve from cache if fresh
    if _active_faults_cache and (time.time() - _active_faults_cache_time < CACHE_TTL):
        return Response(
            content=_active_faults_cache,
            media_type="application/json",
            headers={"Content-Encoding": "gzip"}
        )

    # Fetch from Supabase
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(SUPABASE_ACTIVE_FAULTS_URL)
        r.raise_for_status()
        json_bytes = r.content  # already in bytes

    # Compress
    compressed = gzip.compress(json_bytes)

    # Cache it
    _active_faults_cache = compressed
    _active_faults_cache_time = time.time()

    return Response(
        content=compressed,
        media_type="application/json",
        headers={"Content-Encoding": "gzip"}
    )

async def geocode_autocomplete(text: str = Query(..., min_length=1)):
    """Proxy to Geoapify autocomplete API."""
    url = "https://api.geoapify.com/v1/geocode/autocomplete"
    params = {"text": text, "apiKey": GEOAPIFY_API_KEY}
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        return r.json()

async def geocode_search(query: str):
    """Search for a location using Geoapify geocoding API."""
    url = "https://api.geoapify.com/v1/geocode/search"
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Strategy 1: Try with amenity type filter for landmarks
        params_amenity = {
            "text": query,
            "apiKey": GEOAPIFY_API_KEY,
            "limit": 5,
            "format": "json",
            "type": "amenity"
        }
        
        r = await client.get(url, params=params_amenity)
        r.raise_for_status()
        data = r.json()
        
        # If we have results with amenity filter, try to find the best match
        if data.get("results") and len(data["results"]) > 0:
            results = data["results"]
            query_lower = query.lower()
            
            # Look for exact name matches or tourism/attraction types
            for result in results:
                result_type = result.get("result_type", "")
                categories = result.get("categories", [])
                name = result.get("name", "").lower()
                
                # Prioritize tourism attractions and exact name matches
                if ("tourism" in categories or "attraction" in categories or 
                    result_type == "amenity" or any(word in name for word in query_lower.split()[:3])):
                    return {"results": [result]}
            
            # Return the first result if no specific match
            return {"results": [results[0]]}
        
        # Strategy 2: Try without type filter but with bias towards places
        params_no_filter = {
            "text": query,
            "apiKey": GEOAPIFY_API_KEY,
            "limit": 1,
            "format": "json"
        }
        
        r2 = await client.get(url, params=params_no_filter)
        r2.raise_for_status()
        data2 = r2.json()
        
        if data2.get("results") and len(data2["results"]) > 0:
            return data2
        
        # Strategy 3: If still no results, try extracting just the landmark name (before "in")
        # This handles cases like "eiffel tower in paris" -> "eiffel tower"
        if " in " in query:
            landmark_name = query.split(" in ")[0].strip()
            params_landmark = {
                "text": landmark_name,
                "apiKey": GEOAPIFY_API_KEY,
                "limit": 1,
                "format": "json"
            }
            
            r3 = await client.get(url, params=params_landmark)
            r3.raise_for_status()
            return r3.json()
        
        # Return empty results if all strategies fail
        return {"results": [], "query": {"text": query}}

async def get_routes(
    start_lat: float,
    start_lon: float,
    dest_lat: float,
    dest_lon: float,
    mode: str = "all"
):
    """Fetch combined routes from Mapbox and TomTom."""
    modes = ["driving", "walking", "cycling", "motorcycle"] if mode == "all" else [mode]
    all_routes = []
    all_route_data = []

    async with httpx.AsyncClient(timeout=15.0) as client:
        for profile in modes:
            # Mapbox routes
            if profile != "motorcycle":
                mb_url = f"https://api.mapbox.com/directions/v5/mapbox/{profile}/{start_lon},{start_lat};{dest_lon},{dest_lat}"
                mb_params = {
                    "geometries": "geojson",
                    "alternatives": "true",
                    "steps": "true",
                    "overview": "full",
                    "access_token": MAPBOX_TOKEN
                }
                try:
                    r = await client.get(mb_url, params=mb_params)
                    data = r.json()
                    if data.get("routes"):
                        for idx, route in enumerate(data["routes"]):
                            all_route_data.append({
                                "profile": profile,
                                "source": "mapbox",
                                "distance": route["distance"],
                                "duration": route["duration"],
                                "steps": route.get("legs", [{}])[0].get("steps", []),
                                "index": idx
                            })
                            all_routes.append({
                                "type": "Feature",
                                "geometry": route["geometry"],
                                "properties": {
                                    "profile": profile,
                                    "source": "mapbox",
                                    "distance": route["distance"],
                                    "duration": route["duration"],
                                    "index": idx
                                }
                            })
                except Exception as e:
                    print(f"Mapbox {profile} failed: {e}")

            # TomTom routes
            if profile in ["driving", "motorcycle", "walking"]:
                travel_mode = "car" if profile == "driving" else (
                    "motorcycle" if profile == "motorcycle" else "pedestrian"
                )
                tt_url = f"https://api.tomtom.com/routing/1/calculateRoute/{start_lat},{start_lon}:{dest_lat},{dest_lon}/json"
                tt_params = {
                    "key": TOMTOM_API_KEY,
                    "travelMode": travel_mode,
                    "routeType": "fastest",
                    "traffic": "true",
                    "maxAlternatives": 5,
                    "instructionsType": "text"
                }
                try:
                    r = await client.get(tt_url, params=tt_params)
                    data = r.json()
                    if data.get("routes"):
                        for idx, route in enumerate(data["routes"]):
                            all_route_data.append({
                                "profile": profile,
                                "source": "tomtom",
                                "distance": route["summary"]["lengthInMeters"],
                                "duration": route["summary"]["travelTimeInSeconds"],
                                "steps": [
                                    {"maneuver": {"instruction": step["message"]}}
                                    for step in route.get("guidance", {}).get("instructions", [])
                                ],
                                "index": idx
                            })
                            all_routes.append({
                                "type": "Feature",
                                "geometry": {
                                    "type": "LineString",
                                    "coordinates": [
                                        [p["longitude"], p["latitude"]]
                                        for leg in route["legs"]
                                        for p in leg["points"]
                                    ]
                                },
                                "properties": {
                                    "profile": profile,
                                    "source": "tomtom",
                                    "distance": route["summary"]["lengthInMeters"],
                                    "duration": route["summary"]["travelTimeInSeconds"],
                                    "index": idx
                                }
                            })
                except Exception as e:
                    print(f"TomTom {profile} failed: {e}")

    return {
        "routesData": all_route_data,
        "geojson": {
            "type": "FeatureCollection",
            "features": all_routes
        }
    }

def get_latest_earthquakes():
    """Get latest earthquake data from the scraper."""
    return {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "earthquakes": get_latest_data()
    }


def get_latest_tsunami():
    """PHIVOLCS tsunami information table (scraped, past 60 days PHST)."""
    return {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "events": get_latest_tsunami_data(),
    }

async def get_weather_data(latitude: float, longitude: float, location: str):
    """
    Fetch current weather data from Open-Meteo API for a specific location.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
        "timezone": "Asia/Manila"
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        data = r.json()
        
        current = data.get("current", {})
        
        return {
            "location": location,
            "temperature": current.get("temperature_2m", 0),
            "weatherCode": current.get("weather_code", 0),
            "windSpeed": current.get("wind_speed_10m", 0),
            "humidity": current.get("relative_humidity_2m", 0),
            "coordinates": [longitude, latitude]
        }

# Cache for province coordinates and weather data
_province_coords_cache = None
_province_weather_cache = None
_province_weather_cache_time = 0
WEATHER_CACHE_TTL = 1800  # 30 minutes

async def get_philippines_weather():
    """
    Fetch weather data for all Philippine provinces from Open-Meteo API.
    Loads coordinates from JSON file - fast and efficient!
    Caches weather data for 30 minutes.
    """
    import json
    from pathlib import Path
    import time
    
    global _province_coords_cache, _province_weather_cache, _province_weather_cache_time
    
    # Check if we have cached weather data that's still fresh
    if _province_weather_cache and (time.time() - _province_weather_cache_time < WEATHER_CACHE_TTL):
        print(f"Returning cached weather data for {len(_province_weather_cache)} provinces")
        return _province_weather_cache
    
    # Load province coordinates (cached after first load)
    if _province_coords_cache is None:
        json_path = Path(__file__).parent.parent / "data" / "province_capitals.json"
        with open(json_path, "r", encoding="utf-8") as f:
            _province_coords_cache = json.load(f)
        print(f"Loaded {len(_province_coords_cache)} province capitals from JSON file")
    else:
        print(f"Using cached coordinates for {len(_province_coords_cache)} provinces")
    
    provinces_with_coords = _province_coords_cache
    
    # Fetch weather for all provinces
    async def fetch_province_weather(client: httpx.AsyncClient, province: dict):
        """Fetch weather for a single province"""
        try:
            url = "https://api.open-meteo.com/v1/forecast"
            params = {
                "latitude": province["lat"],
                "longitude": province["lon"],
                "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
                "timezone": "Asia/Manila"
            }
            
            r = await client.get(url, params=params)
            r.raise_for_status()
            data = r.json()
            
            current = data.get("current", {})
            
            return {
                "location": f"{province['capital']}, {province['province']}",
                "province": province["province"],
                "temperature": current.get("temperature_2m", 0),
                "weatherCode": current.get("weather_code", 0),
                "windSpeed": current.get("wind_speed_10m", 0),
                "humidity": current.get("relative_humidity_2m", 0),
                "coordinates": [province["lon"], province["lat"]]
            }
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                # Rate limited, wait and retry once
                await asyncio.sleep(1)
                try:
                    r = await client.get(url, params=params)
                    r.raise_for_status()
                    data = r.json()
                    current = data.get("current", {})
                    return {
                        "location": f"{province['capital']}, {province['province']}",
                        "province": province["province"],
                        "temperature": current.get("temperature_2m", 0),
                        "weatherCode": current.get("weather_code", 0),
                        "windSpeed": current.get("wind_speed_10m", 0),
                        "humidity": current.get("relative_humidity_2m", 0),
                        "coordinates": [province["lon"], province["lat"]]
                    }
                except Exception:
                    print(f"Error fetching weather for {province['province']} after retry")
                    return None
            else:
                print(f"Error fetching weather for {province['province']}: {e}")
                return None
        except Exception as e:
            print(f"Error fetching weather for {province['province']}: {e}")
            return None
    
    # Fetch weather in batches of 20 to avoid rate limiting
    weather_data = []
    batch_size = 20
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        for i in range(0, len(provinces_with_coords), batch_size):
            batch = provinces_with_coords[i:i + batch_size]
            tasks = [fetch_province_weather(client, province) for province in batch]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Filter out None values and exceptions
            batch_data = [
                result for result in results 
                if result is not None and not isinstance(result, Exception)
            ]
            weather_data.extend(batch_data)
            
            # Small delay between batches to respect rate limits
            if i + batch_size < len(provinces_with_coords):
                await asyncio.sleep(0.5)
    
    print(f"Successfully fetched weather data for {len(weather_data)}/{len(provinces_with_coords)} provinces")
    
    # Cache the weather data
    _province_weather_cache = weather_data
    _province_weather_cache_time = time.time()
    
    return weather_data

async def geocode_location(location_name: str, province: str):
    """
    Geocode a location (city/municipality) to get its coordinates.
    Uses Geoapify API (already configured in your backend).
    """
    try:
        url = "https://api.geoapify.com/v1/geocode/search"
        params = {
            "text": f"{location_name}, {province}, Philippines",
            "apiKey": GEOAPIFY_API_KEY,
            "limit": 1,
            "format": "json"
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url, params=params)
            r.raise_for_status()
            data = r.json()
            
            if data.get("results") and len(data["results"]) > 0:
                result = data["results"][0]
                return {
                    "latitude": result["lat"],
                    "longitude": result["lon"],
                    "display_name": result.get("formatted", "")
                }
            else:
                print(f"No geocoding results for: {location_name}, {province}")
                return None
    except Exception as e:
        print(f"Geocoding error for {location_name}, {province}: {e}")
        return None

# Cache for city coordinates and weather data
_cities_coords_cache = None
_cities_weather_cache = {}
_cities_weather_cache_time = {}

async def get_province_weather_by_name(province_name: str):
    """
    Fetch weather data for all cities/municipalities in a province.
    Loads coordinates from JSON file - fast and efficient!
    Caches weather data for 30 minutes per province.
    """
    import json
    from pathlib import Path
    import time
    
    global _cities_coords_cache, _cities_weather_cache, _cities_weather_cache_time
    
    # Check if we have cached weather data for this province
    cache_key = province_name
    if cache_key in _cities_weather_cache:
        cache_age = time.time() - _cities_weather_cache_time.get(cache_key, 0)
        if cache_age < WEATHER_CACHE_TTL:
            print(f"Returning cached weather data for {len(_cities_weather_cache[cache_key])} cities in {province_name}")
            return _cities_weather_cache[cache_key]
    
    # Load cities/municipalities from JSON file (cached after first load)
    if _cities_coords_cache is None:
        json_path = Path(__file__).parent.parent / "data" / "cities_municipalities.json"
        with open(json_path, "r", encoding="utf-8") as f:
            _cities_coords_cache = json.load(f)
        print(f"Loaded cities data from JSON file")
    
    cities = _cities_coords_cache.get(province_name, [])
    
    if not cities:
        print(f"No cities found for province: {province_name} in JSON file")
        return []
    
    print(f"Loaded {len(cities)} cities for {province_name} from cache")
    
    # Convert to the format expected by get_custom_locations_weather
    geocoded_locations = [
        {
            "name": city["name"],
            "province": province_name,
            "latitude": city["lat"],
            "longitude": city["lon"]
        }
        for city in cities
    ]
    
    # Fetch weather for all cities
    weather_data = await get_custom_locations_weather(geocoded_locations)
    
    # Cache the weather data
    _cities_weather_cache[cache_key] = weather_data
    _cities_weather_cache_time[cache_key] = time.time()
    
    return weather_data

async def get_custom_locations_weather(locations: list):
    """
    Fetch weather data for custom list of locations.
    Each location should have: name, province, latitude, longitude
    """
    if not locations:
        return []
    
    # Fetch weather for each location
    async def fetch_location_weather(client: httpx.AsyncClient, location: dict):
        """Fetch weather for a single location"""
        try:
            url = "https://api.open-meteo.com/v1/forecast"
            params = {
                "latitude": location.get("latitude") or location.get("lat"),
                "longitude": location.get("longitude") or location.get("lon"),
                "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
                "timezone": "Asia/Manila"
            }
            
            r = await client.get(url, params=params)
            r.raise_for_status()
            data = r.json()
            
            current = data.get("current", {})
            
            lon = location.get("longitude") or location.get("lon")
            lat = location.get("latitude") or location.get("lat")
            
            return {
                "location": f"{location['name']}, {location['province']}",
                "city": location["name"],
                "province": location["province"],
                "temperature": current.get("temperature_2m", 0),
                "weatherCode": current.get("weather_code", 0),
                "windSpeed": current.get("wind_speed_10m", 0),
                "humidity": current.get("relative_humidity_2m", 0),
                "coordinates": [lon, lat]
            }
        except Exception as e:
            print(f"Error fetching weather for {location.get('name', 'Unknown')}: {e}")
            return None
    
    # Fetch in batches
    weather_data = []
    batch_size = 15
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        for i in range(0, len(locations), batch_size):
            batch = locations[i:i + batch_size]
            tasks = [fetch_location_weather(client, loc) for loc in batch]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            batch_data = [
                result for result in results 
                if result is not None and not isinstance(result, Exception)
            ]
            weather_data.extend(batch_data)
            
            if i + batch_size < len(locations):
                await asyncio.sleep(0.3)
    
    print(f"Fetched weather for {len(weather_data)}/{len(locations)} custom locations")
    
    return weather_data

async def root():
    """Root endpoint."""
    return {"message": "Hazard Data API is running"}