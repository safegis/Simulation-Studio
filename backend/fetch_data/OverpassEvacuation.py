"""
Overpass API — schools, social facilities, evacuation centres near a point.
Used by Pathfinder "Find Shelter/s" mode.
"""
import logging
import os
from typing import Any, Dict, List, Optional

import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# Public Overpass instances (respect usage policy; consider self-hosted for production).
# overpass-api.de often returns 406 without a descriptive User-Agent, and 504 when busy.
_DEFAULT_OVERPASS_URLS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
)

_ENV_URL = os.environ.get("OVERPASS_INTERPRETER_URL", "").strip()


def _overpass_urls() -> List[str]:
    """Primary URL from env (if set), then known public mirrors (deduped)."""
    urls: List[str] = []
    if _ENV_URL:
        urls.append(_ENV_URL)
    for u in _DEFAULT_OVERPASS_URLS:
        if u not in urls:
            urls.append(u)
    return urls


_OVERPASS_HEADERS = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Accept": "application/json",
    # Required by public Overpass instances — generic python-httpx UA gets HTTP 406.
    "User-Agent": "SafeGIS-SimulationStudio/1.0 (pathfinder-evacuation; contact via SafeGIS project)",
}


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
        "tags": {
            k: str(v)
            for k, v in tags.items()
            if k in ("amenity", "emergency", "operator", "addr:street", "addr:city")
        },
    }


async def _post_overpass(query: str) -> Dict[str, Any]:
    """Try Overpass mirrors until one succeeds; raise HTTPException if all fail."""
    last_status: Optional[int] = None
    last_error: Optional[str] = None

    async with httpx.AsyncClient(timeout=60.0) as client:
        for url in _overpass_urls():
            try:
                resp = await client.post(
                    url,
                    data={"data": query},
                    headers=_OVERPASS_HEADERS,
                )
                if resp.status_code >= 400:
                    last_status = resp.status_code
                    last_error = f"{url} -> HTTP {resp.status_code}"
                    logger.warning("Overpass mirror failed: %s", last_error)
                    continue
                payload = resp.json()
                if not isinstance(payload, dict):
                    last_error = f"{url} -> non-object JSON"
                    logger.warning("Overpass mirror failed: %s", last_error)
                    continue
                logger.info("Overpass evacuation OK via %s", url)
                return payload
            except httpx.HTTPError as e:
                last_error = f"{url} -> {type(e).__name__}: {e}"
                logger.warning("Overpass mirror request error: %s", last_error)
            except ValueError as e:
                last_error = f"{url} -> invalid JSON: {e}"
                logger.warning("Overpass mirror failed: %s", last_error)

    if last_status is not None:
        raise HTTPException(
            status_code=502,
            detail=f"Overpass API HTTP error: {last_status} (all mirrors failed)",
        )
    raise HTTPException(
        status_code=503,
        detail=f"Could not reach Overpass API: {last_error or 'unknown error'}",
    )


async def query_evacuation_places(lat: float, lon: float, radius_km: float) -> Dict[str, Any]:
    """
    radius_km: search radius; enforced minimum 0.5 km (500 m), max 50 km.
    """
    radius_km = max(0.5, min(radius_km, 50.0))
    radius_m = int(radius_km * 1000)
    radius_m = max(500, min(radius_m, 50_000))

    query = _build_overpass_query(lat, lon, radius_m)
    logger.info("Overpass evacuation query: lat=%s lon=%s radius_m=%s", lat, lon, radius_m)

    payload = await _post_overpass(query)

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
