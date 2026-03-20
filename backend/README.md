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
