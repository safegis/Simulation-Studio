"""
Overpass API — schools, social facilities, evacuation centres near a point.
Used by Pathfinder "Find Shelter/s" mode.
"""
import logging
from typing import Any, Dict, List, Optional

import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# Public Overpass instance (respect usage policy; consider self-hosted for production)
OVERPASS_INTERPRETER_URL = "https://overpass-api.de/api/interpreter"


def _build_overpass_query(lat: float, lon: float, radius_m: int) -> str:
    # nwr = nodes, ways, relations; out center = centroid for ways/relations
    return f"""[out:json][timeout:55];
(
  nwr["amenity"="school"](around:{radius_m},{lat},{lon});
  nwr["amenity"="social_facility"](around:{radius_m},{lat},{lon});
  nwr["emergency"="evacuation_centre"](around:{radius_m},{lat},{lon});
  nwr["amenity"="community_centre"](around:{radius_m},{lat},{lon});
);
out center tags;
"""


def _element_to_place(el: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    tags = el.get("tags") or {}
    oid = el.get("id")
    otype = el.get("type")
    if oid is None or not otype:
        return None

    name = (
        tags.get("name")
        or tags.get("official_name")
        or tags.get("alt_name")
        or tags.get("operator")
        or f"{otype} {oid}"
    )

    lat_p = el.get("lat")
    lon_p = el.get("lon")
    if lat_p is None or lon_p is None:
        center = el.get("center") or {}
        lat_p = center.get("lat")
        lon_p = center.get("lon")
    if lat_p is None or lon_p is None:
        return None

    kind = tags.get("amenity") or tags.get("emergency") or tags.get("building") or ""

    return {
        "id": f"{otype}/{oid}",
        "name": str(name),
        "lat": float(lat_p),
        "lon": float(lon_p),
        "kind": str(kind),
        "tags": {k: str(v) for k, v in tags.items() if k in ("amenity", "emergency", "operator", "addr:street", "addr:city")},
    }


async def query_evacuation_places(lat: float, lon: float, radius_km: float) -> Dict[str, Any]:
    """
    radius_km: search radius; enforced minimum 0.5 km (500 m), max 50 km.
    """
    radius_km = max(0.5, min(radius_km, 50.0))
    radius_m = int(radius_km * 1000)
    radius_m = max(500, min(radius_m, 50_000))

    query = _build_overpass_query(lat, lon, radius_m)
    logger.info("Overpass evacuation query: lat=%s lon=%s radius_m=%s", lat, lon, radius_m)

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                OVERPASS_INTERPRETER_URL,
                data={"data": query},
                headers={"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"},
            )
            resp.raise_for_status()
            payload = resp.json()
    except httpx.HTTPStatusError as e:
        logger.warning("Overpass HTTP error: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"Overpass API HTTP error: {e.response.status_code}",
        ) from e
    except httpx.RequestError as e:
        logger.warning("Overpass request failed: %s", e)
        raise HTTPException(
            status_code=503,
            detail=f"Could not reach Overpass API: {type(e).__name__}: {e!r}",
        ) from e
    except ValueError as e:
        raise HTTPException(status_code=502, detail=f"Invalid Overpass response: {e}") from e

    elements: List[Dict[str, Any]] = payload.get("elements") or []
    seen: set[str] = set()
    places: List[Dict[str, Any]] = []
    for el in elements:
        p = _element_to_place(el)
        if not p:
            continue
        key = p["id"]
        if key in seen:
            continue
        seen.add(key)
        places.append(p)

    # Nearest-first (straight-line) for nicer dropdown order
    places.sort(
        key=lambda p: (p["lat"] - lat) ** 2 + (p["lon"] - lon) ** 2
    )

    return {"places": places, "count": len(places), "radius_km": radius_km}
