# Unified FastAPI Backend Server
# Single server with all endpoints: hazard data, weather, geocoding, and exposure assessment

import sys
from contextlib import asynccontextmanager

# Windows-specific event loop policy fix for subprocess support
if sys.platform.startswith("win"):
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI, Query, Body, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import our modules
from fetch_data.HazardScraper import start_scraper
from fetch_data import (
    MapHazardAPIs,
    ExposureAssessment,
    GeoBoundaries,
    TomTomTraffic,
    OverpassEvacuation,
    OverpassBoundaries,
    GeoapifyBoundaries,
    SpatialDataConnect,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - starts background tasks and manages cleanup."""
    # Start the background scraper thread
    start_scraper()
    yield
    # Cleanup on shutdown
    ExposureAssessment.cleanup()

# Create FastAPI app with lifespan manager
app = FastAPI(title="Unified Hazard Data API", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for testing); restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------
# Register all API routes
# -----------------------

@app.get("/")
async def root():
    return await MapHazardAPIs.root()

# Earthquake endpoints
@app.get("/earthquakes/latest")
def get_latest_earthquakes():
    return MapHazardAPIs.get_latest_earthquakes()

@app.get("/hazards/earthquakes")
async def get_earthquakes(feed: str = "all_day"):
    return await MapHazardAPIs.get_earthquakes(feed)

# Volcano endpoints
@app.get("/hazards/volcanoes")
async def get_volcanoes():
    return await MapHazardAPIs.get_volcanoes()

# Active faults endpoint
@app.get("/hazards/active-faults")
async def get_active_faults():
    return await MapHazardAPIs.get_active_faults()

# Geocoding endpoints
@app.get("/geocode/autocomplete")
async def geocode_autocomplete(text: str = Query(..., min_length=1)):
    return await MapHazardAPIs.geocode_autocomplete(text)

@app.get("/geocode/search")
async def geocode_search(query: str = Query(..., min_length=1)):
    return await MapHazardAPIs.geocode_search(query)

# Routes endpoint
@app.get("/routes")
async def get_routes(
    start_lat: float,
    start_lon: float,
    dest_lat: float,
    dest_lon: float,
    mode: str = "all"
):
    return await MapHazardAPIs.get_routes(start_lat, start_lon, dest_lat, dest_lon, mode)

# Weather endpoints
@app.get("/weather/philippines")
async def get_philippines_weather():
    return await MapHazardAPIs.get_philippines_weather()

@app.get("/weather/location")
async def get_weather_data(latitude: float, longitude: float, location: str):
    return await MapHazardAPIs.get_weather_data(latitude, longitude, location)

@app.post("/weather/custom-locations")
async def get_custom_locations_weather(locations: list = Body(...)):
    return await MapHazardAPIs.get_custom_locations_weather(locations)

@app.get("/weather/province/{province_name}")
async def get_province_weather(province_name: str):
    return await MapHazardAPIs.get_province_weather_by_name(province_name)

# Exposure Assessment endpoint
@app.post(
    "/api/exposure-assessment",
    response_model=ExposureAssessment.ExposureAssessmentResponse,
)
async def run_exposure_assessment(
    http_request: Request,
    request: ExposureAssessment.ExposureAssessmentRequest,
):
    """Run exposure assessment analysis (stops compute if the client disconnects/aborts)."""
    return await ExposureAssessment.run_exposure_assessment(http_request, request)

# GeoBoundaries endpoint
@app.get("/api/boundaries/{country_code}/{admin_level}")
async def get_boundaries(country_code: str, admin_level: str):
    """
    Fetch administrative boundary data from geoBoundaries API
    
    Args:
        country_code: ISO3 country code (e.g., 'USA', 'PHL', 'ALB')
        admin_level: Admin level (e.g., 'ADM0', 'ADM1', 'ADM2')
    
    Returns:
        GeoJSON FeatureCollection with boundary data
    """
    return await GeoBoundaries.get_boundary_data(country_code, admin_level)


@app.get("/api/boundaries/osm/{iso2}/{admin_slot}")
async def get_boundaries_osm(iso2: str, admin_slot: str):
    """
    Administrative boundaries from OpenStreetMap (Overpass API).

    ``iso2``: ISO 3166-1 alpha-2 (e.g. PH, DE). ``admin_slot``: admin0–admin3
    mapped to typical OSM admin_level values (2 / 4 / 8 / 6). Bulk extracts:
    Geofabrik (https://download.geofabrik.de/).
    """
    return await OverpassBoundaries.fetch_osm_admin_boundaries(iso2, admin_slot)


@app.get("/api/boundaries/geoapify/{iso2}/{admin_slot}")
async def get_boundaries_geoapify(
    iso2: str,
    admin_slot: str,
    country: str = Query(
        ...,
        min_length=2,
        max_length=200,
        description="Country name for Geoapify geocoding (e.g. Philippines)",
    ),
):
    """
    Administrative boundaries via Geoapify (Geocoding + Boundaries API).
    Requires ``NEXT_PUBLIC_GEOAPIFY_API_KEY``. Optional: ``GEOAPIFY_BOUNDARIES_GEOMETRY``
    (default ``geometry_10000``).
    """
    return await GeoapifyBoundaries.fetch_geoapify_boundaries(iso2, admin_slot, country)


@app.get("/api/overpass/evacuation-destinations")
async def get_evacuation_destinations(
    lat: float = Query(..., description="Starting latitude (WGS84)"),
    lon: float = Query(..., description="Starting longitude (WGS84)"),
    radius_km: float = Query(
        5.0,
        ge=0.5,
        le=50.0,
        description="Search radius in km (min 0.5)",
    ),
):
    """
    Schools, social facilities, community centres, and evacuation centres from OSM (Overpass).
    """
    return await OverpassEvacuation.query_evacuation_places(lat, lon, radius_km)


@app.post("/api/spatial-data/fetch-url")
async def spatial_data_fetch_url(request: SpatialDataConnect.FetchUrlRequest):
    """
    Server-side fetch of a URL returning GeoJSON (FeatureCollection, Feature, or Geometry).
    Proxies auth headers so secrets are not persisted in the browser.
    """
    return await SpatialDataConnect.fetch_url_geojson(request)


@app.post("/api/spatial-data/postgis")
def spatial_data_postgis(request: SpatialDataConnect.PostgisRequest):
    """
    Read up to 10k rows from a PostGIS table/view into GeoJSON (via GeoPandas).
    """
    return SpatialDataConnect.fetch_postgis_geojson(request)


# Include TomTom Traffic router
app.include_router(TomTomTraffic.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)