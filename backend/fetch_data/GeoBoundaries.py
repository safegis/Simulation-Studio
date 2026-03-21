"""GeoBoundaries integration: official API + GitHub raw fallback.

The documented API is still:
  https://www.geoboundaries.org/api/current/gbOpen/[ISO3]/[ADM]/
per https://www.geoboundaries.org/api.html

Many networks see ConnectTimeout to www.geoboundaries.org while GitHub raw
files remain reachable — geoBoundaries hosts canonical data on:
  https://github.com/wmgeolab/geoBoundaries
"""
from __future__ import annotations

import json
import logging
import os
import httpx
from fastapi import HTTPException
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# Official JSON metadata endpoint (returns gjDownloadURL, simplifiedGeometryGeoJSON, …)
GEOBOUNDARIES_API_TMPL = (
    "https://www.geoboundaries.org/api/current/gbOpen/{iso3}/{adm}/"
)
# Mirror: simplified GeoJSON in repo (gbOpen release).
# NOTE: raw.githubusercontent.com returns Git LFS *pointer* text for these files, not JSON.
# github.com/.../raw/... follows redirects to the real LFS blob.
GITHUB_GEOJSON_TMPL = (
    "https://github.com/wmgeolab/geoBoundaries/raw/{ref}/"
    "releaseData/gbOpen/{iso3}/{adm}/geoBoundaries-{iso3}-{adm}_simplified.geojson"
)


def _format_request_error(e: httpx.RequestError) -> str:
    """httpx often leaves str(e) empty; use type + repr + __cause__."""
    name = type(e).__name__
    body = str(e).strip() or repr(e)
    if e.__cause__ is not None:
        return f"{name}: {body} (caused by {e.__cause__!r})"
    return f"{name}: {body}"


def _github_ref() -> str:
    return os.environ.get("GEOBOUNDARIES_GITHUB_REF", "main").strip() or "main"


def _skip_api() -> bool:
    return os.environ.get("GEOBOUNDARIES_SKIP_API", "").lower() in (
        "1",
        "true",
        "yes",
    )


def _rewrite_wmgeolab_raw_github_url(url: str) -> str:
    """Map raw.githubusercontent.com/wmgeolab/geoBoundaries/... to github.com/.../raw/... (real LFS file)."""
    prefix = "https://raw.githubusercontent.com/wmgeolab/geoBoundaries/"
    if not url.startswith(prefix):
        return url
    rest = url[len(prefix) :]
    parts = rest.split("/", 1)
    if len(parts) < 2:
        return url
    ref, path = parts
    return f"https://github.com/wmgeolab/geoBoundaries/raw/{ref}/{path}"


def _github_simplified_geojson_url(iso3: str, adm: str) -> str:
    return GITHUB_GEOJSON_TMPL.format(iso3=iso3, adm=adm, ref=_github_ref())


def _normalize_codes(country_code: str, admin_level: str) -> tuple[str, str]:
    iso3 = (country_code or "").strip().upper()
    adm = (admin_level or "").strip().upper()
    if len(iso3) != 3 or not iso3.isalpha():
        raise HTTPException(
            status_code=400,
            detail="country_code must be a 3-letter ISO-3166-1 alpha-3 code (e.g. PHL, USA)",
        )
    if adm not in ("ADM0", "ADM1", "ADM2", "ADM3", "ADM4", "ADM5"):
        raise HTTPException(
            status_code=400,
            detail="admin_level must be one of ADM0–ADM5",
        )
    return iso3, adm


async def _fetch_geojson(
    client: httpx.AsyncClient, url: str, context: str
) -> Dict[str, Any]:
    url = _rewrite_wmgeolab_raw_github_url(url)
    try:
        resp = await client.get(url)
    except httpx.RequestError as e:
        logger.warning(
            "Boundary GeoJSON download failed (%s) url=%s — %s",
            context,
            url[:160],
            _format_request_error(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=503,
            detail=(
                f"Network error while downloading boundary GeoJSON ({context}): "
                f"{_format_request_error(e)}"
            ),
        )
    if resp.status_code == 404:
        raise HTTPException(
            status_code=404,
            detail="Boundary GeoJSON not found (country/level may be unavailable)",
        )
    resp.raise_for_status()
    try:
        geojson_data = resp.json()
    except json.JSONDecodeError as e:
        # Git LFS pointer when someone still hits raw.githubusercontent.com
        if (
            isinstance(resp.text, str)
            and resp.text.lstrip().startswith("version https://git-lfs.github.com")
        ):
            alt = _rewrite_wmgeolab_raw_github_url(url)
            if alt != url:
                logger.warning(
                    "GeoJSON URL returned Git LFS pointer; retrying via github.com/raw: %s",
                    alt[:120],
                )
                return await _fetch_geojson(client, alt, context)
        raise HTTPException(
            status_code=502,
            detail=f"Invalid GeoJSON from {context}: {e}",
        )
    if not geojson_data or "features" not in geojson_data:
        raise HTTPException(status_code=404, detail="Empty or invalid GeoJSON structure")
    if len(geojson_data["features"]) == 0:
        raise HTTPException(status_code=404, detail="Empty GeoJSON data")
    for index, feature in enumerate(geojson_data["features"]):
        if "id" not in feature:
            feature["id"] = index
    return geojson_data


async def get_boundary_data(country_code: str, admin_level: str) -> Dict[str, Any]:
    """
    Fetch boundary GeoJSON (simplified) for gbOpen release.

    Tries the official geoBoundaries API first; on connection failures or non-OK
    responses (except 404), falls back to the GitHub raw mirror documented by the project.
    """
    iso3, adm = _normalize_codes(country_code, admin_level)
    api_url = GEOBOUNDARIES_API_TMPL.format(iso3=iso3, adm=adm)

    timeout = httpx.Timeout(45.0, connect=15.0)
    geojson_url: Optional[str] = None
    geojson_from_api = False
    source_label = "geoBoundaries API"

    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        if not _skip_api():
            try:
                meta_response = await client.get(api_url)
                if meta_response.status_code == 404:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Boundary data not available for {iso3} at {adm}",
                    )
                meta_response.raise_for_status()
                metadata = meta_response.json()
                if not metadata:
                    raise ValueError("empty metadata")
                geojson_url = metadata.get("simplifiedGeometryGeoJSON") or metadata.get(
                    "gjDownloadURL"
                )
                if not geojson_url:
                    raise KeyError("no geojson url in metadata")
                geojson_from_api = True
            except HTTPException:
                raise
            except httpx.RequestError as e:
                logger.warning(
                    "geoBoundaries.org unreachable (%s %s): %s — using GitHub mirror",
                    iso3,
                    adm,
                    _format_request_error(e),
                )
                geojson_url = None
                geojson_from_api = False
            except (httpx.HTTPStatusError, ValueError, KeyError, json.JSONDecodeError) as e:
                logger.warning(
                    "geoBoundaries.org API did not yield a GeoJSON URL (%s %s): %s — using GitHub mirror",
                    iso3,
                    adm,
                    e,
                )
                geojson_url = None
                geojson_from_api = False

        if not geojson_url:
            geojson_url = _github_simplified_geojson_url(iso3, adm)
            source_label = "GitHub mirror (wmgeolab/geoBoundaries)"
            geojson_from_api = False
            logger.info("Fetching boundaries from %s", geojson_url)

        try:
            return await _fetch_geojson(client, geojson_url, source_label)
        except HTTPException as first_exc:
            # API metadata often points at GitHub; if that download fails, try canonical path once
            if not geojson_from_api:
                raise first_exc
            fallback = _github_simplified_geojson_url(iso3, adm)
            if fallback.rstrip("/") == (geojson_url or "").rstrip("/"):
                raise first_exc
            logger.warning(
                "GeoJSON from API metadata failed (%s), retrying canonical GitHub path",
                first_exc.detail,
            )
            return await _fetch_geojson(
                client,
                fallback,
                "GitHub mirror (wmgeolab/geoBoundaries)",
            )
