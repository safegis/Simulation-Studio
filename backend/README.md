<div align="center">
  <h1>Simulation Studio - Backend</h1>
</div>

> **Monorepo:** This service lives under `backend/` in the Simulation-Studio repo. **Use Git only from the repository root** (parent folder that contains `frontend/`, `backend/`, and `.git`) — see the root [`README.md`](../README.md#git-workflow).

### 🧐 I. Overview

This repo contains the backend side of SafeGIS's Simulation Studio. It contains the following:

- Centralized API gateway ([Map-HazardDataAPIs.py](https://github.com/m3mentomor1/SafeGIS-Simulation-Studio/blob/MVP-Release-1.0-Backend/Map-HazardDataAPIs.py)) for fetching map and hazard data from multiple API services.
- Centralized web scraper ([HazardDataScraper.py](https://github.com/m3mentomor1/SafeGIS-Simulation-Studio/blob/MVP-Release-1.0-Backend/HazardDataScraper.py)) for fetching hazard data from multiple websites.
  <br><br>

##

### 💻 II. Tech Stack

`Python` `FastAPI` `ScrapeGraphAI`

### Run the backend (development)

From the directory that contains `Simulation-Studio` (e.g. the SafeGIS repo root):

```bash
cd Simulation-Studio/backend
.venv/bin/python main.py
```

If you are **already** at the Simulation-Studio monorepo root:

```bash
cd backend
.venv/bin/python main.py
```

Create the venv and install dependencies first if needed: `python -m venv .venv && .venv/bin/pip install -r requirements.txt` (from `backend/`).

### Import / connect spatial data (panel)

- `POST /api/spatial-data/fetch-url` — Server-side HTTP GET/POST to a URL; returns GeoJSON `FeatureCollection` (or wraps `Feature` / geometry). Supports Bearer, API key header/query, and Basic auth. Secrets are sent in the request body to this backend only.
- `POST /api/spatial-data/postgis` — PostgreSQL/PostGIS only: reads up to **10,000** rows from `schema.table` via GeoPandas. Other engines in the UI are not wired yet.

Requires `sqlalchemy` and `psycopg2-binary` (see `requirements.txt`). Install with `pip install -r requirements.txt` from `backend/`.

**MCP tab:** Uses the same GeoJSON HTTP proxy as API (GET + optional Bearer). Full MCP session protocol (JSON-RPC over SSE/WebSocket) is not implemented in Simulation Studio yet.

### Boundaries

**geoBoundaries** — `GET /api/boundaries/{ISO3}/{ADM}` loads administrative boundaries from [geoBoundaries](https://www.geoboundaries.org/). If `www.geoboundaries.org` times out, the backend falls back to the [wmgeolab/geoBoundaries](https://github.com/wmgeolab/geoBoundaries) `releaseData` mirror via **`github.com/.../raw/...`** (not `raw.githubusercontent.com`, which serves Git LFS pointer files for this repo).

| Variable | Purpose |
|----------|---------|
| `GEOBOUNDARIES_GITHUB_REF` | Git branch or tag for raw URLs (default `main`). |
| `GEOBOUNDARIES_SKIP_API` | If `1` / `true` / `yes`, skip the org API and use GitHub only (useful when the site is unreachable). |

**OpenStreetMap (Overpass)** — `GET /api/boundaries/osm/{ISO2}/{admin_slot}` returns administrative polygons from live OSM via the public [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API). `admin_slot` is one of `admin0` … `admin3`, mapped to typical OSM `admin_level` values (`2` / `4` / `8` / `6`). Coverage and meaning of levels **vary by country**; results may differ from geoBoundaries.

Bulk regional extracts (PBF/SHP) for offline workflows are available from [Geofabrik](https://download.geofabrik.de/) — not used by this endpoint.

| Variable | Purpose |
|----------|---------|
| `OVERPASS_INTERPRETER_URL` | Overpass interpreter base URL (default `https://overpass-api.de/api/interpreter`). |

Data © OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright).

**Geoapify** — `GET /api/boundaries/geoapify/{ISO2}/{admin_slot}?country=...` uses the same [Geoapify](https://www.geoapify.com/) key as geocoding (`NEXT_PUBLIC_GEOAPIFY_API_KEY`). The `country` query parameter must be the **country name** used for geocoding (e.g. `Philippines`), matching the catalog’s `name` field. `admin_slot` is `admin0`–`admin3`: country outline via **part-of**, subdivisions via **consists-of** (with Geoapify `sublevel` for deeper tiers). Hierarchy varies by country.

| Variable | Purpose |
|----------|---------|
| `GEOAPIFY_BOUNDARIES_GEOMETRY` | `geometry_1000` / `geometry_5000` / `geometry_10000` (default). Larger = simpler geometry, fewer API credits. |
