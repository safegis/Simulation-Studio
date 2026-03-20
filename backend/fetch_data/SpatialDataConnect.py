"""
Proxy remote GeoJSON (HTTP) and read PostGIS tables into GeoJSON.
Used by Simulation Studio "Import / connect spatial data" panel.
"""

from __future__ import annotations

import json
import re
from typing import Any, Literal, Optional
from urllib.parse import quote_plus, parse_qsl, urlencode, urlparse, urlunparse

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import create_engine

MAX_RESPONSE_BYTES = 20 * 1024 * 1024
REQUEST_TIMEOUT = httpx.Timeout(60.0, connect=15.0)
IDENT_RE = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*$")


def _assert_ident(name: str, label: str = "identifier") -> str:
    n = name.strip()
    if not n or len(n) > 63 or not IDENT_RE.match(n):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {label}: use letters, numbers, underscore; max 63 chars.",
        )
    return n


def normalize_geojson_payload(data: Any) -> dict[str, Any]:
    """Return a GeoJSON FeatureCollection dict."""
    if data is None:
        raise HTTPException(status_code=422, detail="Empty JSON body")
    if not isinstance(data, dict):
        raise HTTPException(status_code=422, detail="Response must be a JSON object")
    t = data.get("type")
    if t == "FeatureCollection":
        feats = data.get("features")
        if not isinstance(feats, list):
            raise HTTPException(status_code=422, detail="Invalid FeatureCollection")
        return data
    if t == "Feature":
        return {"type": "FeatureCollection", "features": [data]}
    if t in ("Point", "LineString", "Polygon", "MultiPoint", "MultiLineString", "MultiPolygon", "GeometryCollection"):
        return {
            "type": "FeatureCollection",
            "features": [{"type": "Feature", "properties": {}, "geometry": data}],
        }
    raise HTTPException(
        status_code=422,
        detail=f"Unsupported GeoJSON type: {t!r}. Expected FeatureCollection, Feature, or Geometry.",
    )


class FetchUrlRequest(BaseModel):
    url: str = Field(..., min_length=8, description="http(s) URL returning GeoJSON JSON")
    method: Literal["GET", "POST"] = "GET"
    auth_type: Literal["none", "bearer", "apikey_header", "apikey_query", "basic"] = "none"
    bearer_or_key_value: Optional[str] = None
    api_key_header_name: str = "X-API-Key"
    api_query_param_name: str = "api_key"
    basic_user: Optional[str] = None
    basic_password: Optional[str] = None
    post_body_json: Optional[str] = Field(
        None, description="JSON string for POST body when method is POST"
    )


async def fetch_url_geojson(req: FetchUrlRequest) -> dict[str, Any]:
    parsed = urlparse(req.url.strip())
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="Only http and https URLs are allowed")
    if not parsed.netloc:
        raise HTTPException(status_code=400, detail="Invalid URL")

    headers: dict[str, str] = {
        "Accept": "application/geo+json, application/json, */*",
        "User-Agent": "SafeGIS-SimulationStudio/1.0",
    }
    params: list[tuple[str, str]] = list(parse_qsl(parsed.query, keep_blank_values=True))

    if req.auth_type == "bearer" and req.bearer_or_key_value:
        headers["Authorization"] = f"Bearer {req.bearer_or_key_value.strip()}"
    elif req.auth_type == "apikey_header" and req.bearer_or_key_value:
        hn = (req.api_key_header_name or "X-API-Key").strip()
        if not re.match(r"^[a-zA-Z0-9_\-]+$", hn):
            raise HTTPException(status_code=400, detail="Invalid API key header name")
        headers[hn] = req.bearer_or_key_value.strip()
    elif req.auth_type == "apikey_query" and req.bearer_or_key_value:
        pn = (req.api_query_param_name or "api_key").strip()
        if not re.match(r"^[a-zA-Z0-9_\-]+$", pn):
            raise HTTPException(status_code=400, detail="Invalid query parameter name")
        params.append((pn, req.bearer_or_key_value.strip()))
    elif req.auth_type == "basic":
        if not req.basic_user or req.basic_password is None:
            raise HTTPException(status_code=400, detail="Basic auth requires username and password")

    new_query = urlencode(params)
    url = urlunparse(
        (parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment)
    )

    body: Any = None
    if req.method == "POST":
        if req.post_body_json and req.post_body_json.strip():
            try:
                body = json.loads(req.post_body_json)
            except json.JSONDecodeError as e:
                raise HTTPException(status_code=400, detail=f"Invalid POST JSON body: {e}") from e

    auth = None
    if req.auth_type == "basic":
        auth = (req.basic_user or "", req.basic_password or "")

    try:
        async with httpx.AsyncClient(
            timeout=REQUEST_TIMEOUT,
            follow_redirects=True,
            limits=httpx.Limits(max_connections=5),
        ) as client:
            if req.method == "GET":
                r = await client.get(url, headers=headers, auth=auth)
            else:
                r = await client.post(url, headers=headers, auth=auth, json=body)
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Request failed: {e!s}") from e

    if r.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Remote server returned {r.status_code}: {r.text[:500]}",
        )

    if len(r.content) > MAX_RESPONSE_BYTES:
        raise HTTPException(status_code=413, detail="Response exceeds size limit (20 MB)")

    try:
        data = r.json()
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Response is not JSON (GeoJSON expected): {e!s}",
        ) from e

    return normalize_geojson_payload(data)


class PostgisRequest(BaseModel):
    host: str
    port: int = Field(5432, ge=1, le=65535)
    database: str
    username: str
    password: str
    db_schema: str = Field(
        "public", description="Schema when table_or_view has no dot (e.g. public)"
    )
    table_or_view: str = Field(..., description='e.g. "parcels" or "public.parcels"')
    geometry_column: str = "geom"
    ssl_mode: Literal["disable", "prefer", "require", "verify-full"] = "require"


def _resolve_schema_table(db_schema: str, table_or_view: str) -> tuple[str, str]:
    t = table_or_view.strip()
    if not t:
        raise HTTPException(status_code=400, detail="Table or view is required")
    if "." in t:
        parts = t.split(".", 1)
        return _assert_ident(parts[0].strip(), "schema"), _assert_ident(
            parts[1].strip(), "table"
        )
    return _assert_ident((db_schema or "public").strip(), "schema"), _assert_ident(
        t, "table"
    )


def fetch_postgis_geojson(req: PostgisRequest) -> dict[str, Any]:
    import geopandas as gpd

    schema, table = _resolve_schema_table(req.db_schema, req.table_or_view)
    geom_col = _assert_ident(req.geometry_column.strip() or "geom", "geometry column")

    user_q = quote_plus(req.username)
    pw_q = quote_plus(req.password)
    db_q = quote_plus(req.database)
    ssl = req.ssl_mode if req.ssl_mode != "disable" else "disable"
    conn = (
        f"postgresql+psycopg2://{user_q}:{pw_q}@{req.host}:{req.port}/{db_q}"
        f"?sslmode={quote_plus(ssl)}"
    )

    sql = f'SELECT * FROM "{schema}"."{table}" LIMIT 10000'

    engine = create_engine(conn, pool_pre_ping=True)
    try:
        gdf = gpd.read_postgis(sql, con=engine, geom_col=geom_col)
    except Exception as e:
        msg = str(e).split("\n")[0][:400]
        raise HTTPException(status_code=502, detail=f"Database error: {msg}") from e
    finally:
        engine.dispose()

    if gdf is None or gdf.empty:
        return {"type": "FeatureCollection", "features": []}

    try:
        gj = json.loads(gdf.to_json())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not serialize to GeoJSON: {e!s}") from e

    return normalize_geojson_payload(gj)
