"""
Administrative boundaries via Geoapify Boundaries API + Geocoding.

Uses the same API key as MapHazardAPIs (NEXT_PUBLIC_GEOAPIFY_API_KEY).

Flow:
  1. Geocode the country (type=country, filter=countrycode) → place_id, lat, lon
  2. admin0: part-of(lat, lon) → pick feature with administrative.country_level
  3. admin1+: consists-of(place_id); sublevel 2 / 3 for admin2 / admin3
     (admin1 = direct children, no sublevel — Geoapify hierarchy varies by country)
"""
from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

import httpx
from fastapi import HTTPException

from fetch_data.iso_codes import iso2_to_iso3

logger = logging.getLogger(__name__)

GEOAPIFY_KEY = os.getenv("NEXT_PUBLIC_GEOAPIFY_API_KEY")
GEOCODE_URL = "https://api.geoapify.com/v1/geocode/search"
PART_OF_URL = "https://api.geoapify.com/v1/boundaries/part-of"
CONSISTS_OF_URL = "https://api.geoapify.com/v1/boundaries/consists-of"

# Larger tolerance = fewer vertices / credits for country-wide layers (see Geoapify docs)
DEFAULT_GEOMETRY = os.getenv("GEOAPIFY_BOUNDARIES_GEOMETRY", "geometry_10000").strip() or "geometry_10000"

_ADMIN_SLOTS = frozenset({"admin0", "admin1", "admin2", "admin3"})


def _normalize_iso2(iso2: str) -> str:
    code = (iso2 or "").strip().upper()
    if len(code) != 2 or not code.isalpha():
        raise HTTPException(
            status_code=400,
            detail="iso2 must be ISO 3166-1 alpha-2 (e.g. PH, DE)",
        )
    return code


def _normalize_slot(admin_slot: str) -> str:
    s = (admin_slot or "").strip().lower()
    if s not in _ADMIN_SLOTS:
        raise HTTPException(
            status_code=400,
            detail="admin_slot must be one of: admin0, admin1, admin2, admin3",
        )
    return s


def _pick_country_polygon(features: List[Dict[str, Any]], country_name: str) -> Optional[Dict[str, Any]]:
    """From part-of results, select the country-level polygon."""
    cn = (country_name or "").strip().lower()
    for f in features:
        props = f.get("properties") or {}
        cats = props.get("categories") or []
        if isinstance(cats, list) and any(
            str(c) == "administrative.country_level" for c in cats
        ):
            return f
    for f in features:
        props = f.get("properties") or {}
        name = (props.get("name") or "").strip().lower()
        if cn and name == cn:
            return f
    if len(features) == 1:
        return features[0]
    return None


def _normalize_features(
    raw_features: List[Dict[str, Any]], iso2: str
) -> Dict[str, Any]:
    iso3 = iso2_to_iso3(iso2) or ""
    out: List[Dict[str, Any]] = []
    for idx, feat in enumerate(raw_features):
        geom = feat.get("geometry")
        if not geom or geom.get("type") not in ("Polygon", "MultiPolygon"):
            continue
        props = feat.get("properties") or {}
        name = props.get("name") or props.get("formatted") or f"Boundary {idx}"
        out.append(
            {
                "type": "Feature",
                "geometry": geom,
                "properties": {
                    "shapeName": str(name),
                    "shapeGroup": iso3,
                    "boundary_source": "geoapify",
                    "geoapify_formatted": str(props.get("formatted") or ""),
                },
                "id": idx,
            }
        )
    if not out:
        raise HTTPException(
            status_code=404,
            detail="Geoapify returned no polygon features for this request",
        )
    return {
        "type": "FeatureCollection",
        "features": out,
        "properties": {
            "source": "Geoapify Boundaries API",
            "attribution": "© OpenStreetMap contributors, ODbL; via Geoapify",
        },
    }


async def _geocode_country(
    client: httpx.AsyncClient, iso2: str, country_name: str
) -> Dict[str, Any]:
    params: Dict[str, Any] = {
        "text": country_name.strip(),
        "filter": f"countrycode:{iso2.lower()}",
        "type": "country",
        "limit": 1,
        "format": "json",
        "apiKey": GEOAPIFY_KEY,
    }
    try:
        r = await client.get(GEOCODE_URL, params=params)
        r.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.warning("Geoapify geocode HTTP %s", e.response.status_code)
        raise HTTPException(
            status_code=502,
            detail=f"Geoapify Geocoding error: HTTP {e.response.status_code}",
        ) from e
    except httpx.RequestError as e:
        logger.warning("Geoapify geocode request failed: %s", e)
        raise HTTPException(
            status_code=503,
            detail=f"Could not reach Geoapify: {type(e).__name__}",
        ) from e
    data = r.json()
    results = data.get("results") or []
    if not results:
        raise HTTPException(
            status_code=404,
            detail=f"Geoapify geocoding found no country match for {country_name!r} ({iso2})",
        )
    row = results[0]
    pid = row.get("place_id")
    lat, lon = row.get("lat"), row.get("lon")
    if not pid or lat is None or lon is None:
        raise HTTPException(
            status_code=502,
            detail="Geoapify geocode response missing place_id or coordinates",
        )
    return {
        "place_id": str(pid),
        "lat": float(lat),
        "lon": float(lon),
        "formatted": str(row.get("formatted") or country_name),
    }


async def fetch_geoapify_boundaries(
    iso2: str,
    admin_slot: str,
    country: str,
) -> Dict[str, Any]:
    if not GEOAPIFY_KEY:
        raise HTTPException(
            status_code=503,
            detail="Missing NEXT_PUBLIC_GEOAPIFY_API_KEY for Geoapify Boundaries",
        )
    iso2n = _normalize_iso2(iso2)
    slot = _normalize_slot(admin_slot)
    geometry = DEFAULT_GEOMETRY

    timeout = httpx.Timeout(120.0, connect=20.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        meta = await _geocode_country(client, iso2n, country)
        place_id = meta["place_id"]
        lat, lon = meta["lat"], meta["lon"]

        if slot == "admin0":
            params = {
                "lat": lat,
                "lon": lon,
                "geometry": geometry,
                "apiKey": GEOAPIFY_KEY,
                "boundaries": "administrative",
            }
            try:
                r = await client.get(PART_OF_URL, params=params)
                r.raise_for_status()
            except httpx.HTTPStatusError as e:
                raise HTTPException(
                    status_code=502,
                    detail=f"Geoapify part-of error: HTTP {e.response.status_code}",
                ) from e
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=503,
                    detail=f"Geoapify part-of unreachable: {type(e).__name__}",
                ) from e
            fc = r.json()
            feats = fc.get("features") or []
            chosen = _pick_country_polygon(feats, country)
            if not chosen:
                raise HTTPException(
                    status_code=404,
                    detail="Could not resolve a single country polygon from Geoapify part-of",
                )
            logger.info(
                "Geoapify boundaries admin0: iso2=%s place=%s n_partof=%s",
                iso2n,
                country,
                len(feats),
            )
            return _normalize_features([chosen], iso2n)

        # admin1+: subdivisions inside country
        params: Dict[str, Any] = {
            "id": place_id,
            "geometry": geometry,
            "apiKey": GEOAPIFY_KEY,
            "boundary": "administrative",
        }
        if slot == "admin2":
            params["sublevel"] = "2"
        elif slot == "admin3":
            params["sublevel"] = "3"
        # admin1: omit sublevel (direct children)

        try:
            r = await client.get(CONSISTS_OF_URL, params=params)
            r.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Geoapify consists-of error: HTTP {e.response.status_code}",
            ) from e
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Geoapify consists-of unreachable: {type(e).__name__}",
            ) from e
        fc = r.json()
        feats = fc.get("features") or []
        logger.info(
            "Geoapify boundaries %s: iso2=%s place=%s n_features=%s",
            slot,
            iso2n,
            country,
            len(feats),
        )
        if not feats:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"No Geoapify subdivisions for {country} at {slot}. "
                    "Try another level or a different data source."
                ),
            )
        return _normalize_features(feats, iso2n)
