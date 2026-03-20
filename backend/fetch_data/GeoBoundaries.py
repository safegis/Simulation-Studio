"""GeoBoundaries API integration for fetching administrative boundary data"""
import httpx
from fastapi import HTTPException
from typing import Dict, Any


async def get_boundary_data(country_code: str, admin_level: str) -> Dict[str, Any]:
    """
    Fetch boundary data from geoBoundaries API
    
    Args:
        country_code: ISO3 country code (e.g., 'USA', 'PHL')
        admin_level: Admin level (e.g., 'ADM0', 'ADM1', 'ADM2')
    
    Returns:
        GeoJSON FeatureCollection with boundary data
    """
    try:
        # Step 1: Get metadata from geoBoundaries API
        api_url = f"https://www.geoboundaries.org/api/current/gbOpen/{country_code}/{admin_level}/"
        
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            # Fetch metadata
            meta_response = await client.get(api_url)
            
            if meta_response.status_code == 404:
                raise HTTPException(
                    status_code=404,
                    detail=f"Boundary data not available for {country_code} at {admin_level}"
                )
            
            meta_response.raise_for_status()
            metadata = meta_response.json()
            
            if not metadata or "simplifiedGeometryGeoJSON" not in metadata:
                raise HTTPException(
                    status_code=404,
                    detail="No boundary data available for this country/level"
                )
            
            # Step 2: Download the actual GeoJSON file
            # Use simplified geometry for faster loading
            geojson_url = metadata.get("simplifiedGeometryGeoJSON") or metadata.get("gjDownloadURL")
            
            if not geojson_url:
                raise HTTPException(
                    status_code=404,
                    detail="No GeoJSON URL found in metadata"
                )
            
            geojson_response = await client.get(geojson_url)
            geojson_response.raise_for_status()
            geojson_data = geojson_response.json()
            
            if not geojson_data or "features" not in geojson_data or len(geojson_data["features"]) == 0:
                raise HTTPException(
                    status_code=404,
                    detail="Empty GeoJSON data"
                )
            
            # Add IDs to features if they don't have them
            for index, feature in enumerate(geojson_data["features"]):
                if "id" not in feature:
                    feature["id"] = index
            
            return geojson_data
            
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Failed to fetch boundary data: {str(e)}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Network error while fetching boundary data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing boundary data: {str(e)}"
        )
