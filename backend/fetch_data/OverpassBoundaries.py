"""
Administrative boundaries from OpenStreetMap via the public Overpass API.

Bulk regional extracts (PBF/SHP) are published by Geofabrik (https://download.geofabrik.de/)
for offline use; this module queries live OSM data through Overpass instead.

OSM ``admin_level`` is only loosely standardized. We map our UI levels with common defaults:
  admin0 -> 2 (country), admin1 -> 4, admin2 -> 8, admin3 -> 6
Coverage and semantics vary by country — results may differ from geoBoundaries.
"""
from __future__ import annotations

import logging
import os
from typing import Any, Dict, List

import httpx
import osm2geojson
from fastapi import HTTPException

from fetch_data.iso_codes import iso2_to_iso3

logger = logging.getLogger(__name__)

OVERPASS_INTERPRETER_URL = os.environ.get(
    "OVERPASS_INTERPRETER_URL",
    "https://overpass-api.de/api/interpreter",
).strip()

# ISO 3166-1 alpha-2 tweaks for OSM (most datasets use the same codes as geoBoundaries)
ISO2_OSM_ALIASES = {
    "UK": "GB",  # rare legacy; our catalog uses GB
}

_ADMIN_SLOT_TO_OSM_LEVEL = {
    "admin0": "2",
    "admin1": "4",
    "admin2": "8",
    "admin3": "6",
}


def _normalize_iso2(iso2: str) -> str:
    code = (iso2 or "").strip().upper()
    if len(code) != 2 or not code.isalpha():
        raise HTTPException(
            status_code=400,
            detail="country code must be ISO 3166-1 alpha-2 (e.g. PH, DE)",
        )
    return ISO2_OSM_ALIASES.get(code, code)


def _normalize_admin_slot(admin_slot: str) -> str:
    s = (admin_slot or "").strip().lower()
    if s not in _ADMIN_SLOT_TO_OSM_LEVEL:
        raise HTTPException(
            status_code=400,
            detail="admin_slot must be one of: admin0, admin1, admin2, admin3",
        )
    return s


def _build_overpass_query(iso2: str, osm_admin_level: str, admin_slot: str) -> str:
    # Country outline: query the country relation directly (works when area index is thin)
    if admin_slot == "admin0":
        return f"""[out:json][timeout:180];
rel["ISO3166-1"="{iso2}"]["boundary"="administrative"]["admin_level"="{osm_admin_level}"];
(._;>;);
out geom;"""
    # Subnational: restrict to country area
    return f"""[out:json][timeout:180];
area["ISO3166-1"="{iso2}"]->.a;
(
  relation["boundary"="administrative"]["admin_level"="{osm_admin_level}"](area.a);
);
(._;>;);
out geom;"""


def _filter_admin_polygons(
    geojson: Dict[str, Any], osm_admin_level: str
) -> List[Dict[str, Any]]:
    """Keep relation MultiPolygons/Polygons for the requested admin_level."""
    feats = geojson.get("features") or []
    out: List[Dict[str, Any]] = []
    for f in feats:
        geom = f.get("geometry")
        if not geom:
            continue
        if geom.get("type") not in ("Polygon", "MultiPolygon"):
            continue
        props = f.get("properties") or {}
        if props.get("type") != "relation":
            continue
        tags = props.get("tags") or {}
        if tags.get("boundary") != "administrative":
            continue
        if str(tags.get("admin_level", "")) != osm_admin_level:
            continue
        out.append(f)
    return out


def _flatten_props_for_map(
    feature: Dict[str, Any], iso2: str, osm_admin_level: str
) -> Dict[str, Any]:
    """Shape properties similar to geoBoundaries (MainCanvas popups)."""
    tags = (feature.get("properties") or {}).get("tags") or {}
    name = (
        tags.get("name")
        or tags.get("name:en")
        or tags.get("official_name")
        or tags.get("ref")
        or f"relation {feature.get('properties', {}).get('id', '')}"
    )
    iso3 = iso2_to_iso3(iso2) or ""
    rid = feature.get("properties", {}).get("id")
    return {
        "shapeName": str(name),
        "shapeGroup": iso3,
        "boundary_source": "osm",
        "osm_relation_id": rid,
        "osm_admin_level": osm_admin_level,
        "iso3166_1": iso2,
    }


async def fetch_osm_admin_boundaries(iso2: str, admin_slot: str) -> Dict[str, Any]:
    iso2n = _normalize_iso2(iso2)
    slot = _normalize_admin_slot(admin_slot)
    osm_level = _ADMIN_SLOT_TO_OSM_LEVEL[slot]
    query = _build_overpass_query(iso2n, osm_level, slot)
    logger.info(
        "Overpass boundaries: iso2=%s slot=%s osm_admin_level=%s",
        iso2n,
        slot,
        osm_level,
    )

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(200.0, connect=30.0)) as client:
            resp = await client.post(
                OVERPASS_INTERPRETER_URL,
                data={"data": query},
                headers={
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                },
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

    try:
        gj = osm2geojson.json2geojson(payload, log_level="ERROR")
    except Exception as e:  # noqa: BLE001
        logger.exception("osm2geojson conversion failed")
        raise HTTPException(
            status_code=502,
            detail=f"Failed to convert OSM data to GeoJSON: {e}",
        ) from e

    polys = _filter_admin_polygons(gj, osm_level)
    if not polys:
        remark = (payload.get("remark") or "") if isinstance(payload, dict) else ""
        raise HTTPException(
            status_code=404,
            detail=(
                f"No OSM administrative polygons for {iso2n} at admin_level={osm_level} "
                f"(slot {slot}). OSM coverage varies; try another level or geoBoundaries. "
                f"{remark}"
            ),
        )

    features: List[Dict[str, Any]] = []
    for index, f in enumerate(polys):
        feat = {
            "type": "Feature",
            "geometry": f.get("geometry"),
            "properties": _flatten_props_for_map(f, iso2n, osm_level),
            "id": index,
        }
        features.append(feat)

    return {
        "type": "FeatureCollection",
        "features": features,
        "properties": {
            "source": "OpenStreetMap",
            "license": "ODbL 1.0 (https://opendatacommons.org/licenses/odbl/)",
            "overpass_instance": OVERPASS_INTERPRETER_URL,
            "admin_slot": slot,
            "osm_admin_level": osm_level,
        },
    }
