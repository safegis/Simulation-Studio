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

### Import / connect spatial data (panel)

- `POST /api/spatial-data/fetch-url` — Server-side HTTP GET/POST to a URL; returns GeoJSON `FeatureCollection` (or wraps `Feature` / geometry). Supports Bearer, API key header/query, and Basic auth. Secrets are sent in the request body to this backend only.
- `POST /api/spatial-data/postgis` — PostgreSQL/PostGIS only: reads up to **10,000** rows from `schema.table` via GeoPandas. Other engines in the UI are not wired yet.

Requires `sqlalchemy` and `psycopg2-binary` (see `requirements.txt`). Install with `pip install -r requirements.txt` from `backend/`.

**MCP tab:** Uses the same GeoJSON HTTP proxy as API (GET + optional Bearer). Full MCP session protocol (JSON-RPC over SSE/WebSocket) is not implemented in Simulation Studio yet.
