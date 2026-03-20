# Simulation-Studio

Monorepo for the SafeGIS **Simulation Studio** stack.

| Directory   | Description                          |
|------------|--------------------------------------|
| `frontend` | Next.js / Mapbox UI                  |
| `backend`  | FastAPI service & geospatial tooling |

## Quick start

**Frontend** (from repo root):

```bash
cd frontend
npm install
npm run dev
```

**Backend** (from repo root):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

See `frontend/README.md` and `backend/README.md` for details.
