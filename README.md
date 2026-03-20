# Simulation-Studio

Monorepo for the SafeGIS **Simulation Studio** stack.

| Directory   | Description                          |
|------------|--------------------------------------|
| `frontend` | Next.js / Mapbox UI                  |
| `backend`  | FastAPI service & geospatial tooling |

## Git workflow

This monorepo has **a single `.git` directory at the repository root** (alongside `frontend/` and `backend/`). There are no separate Git repos inside `frontend` or `backend`.

**Always run Git from the root** when committing or pushing:

```bash
cd /path/to/Simulation-Studio   # folder that contains .git, frontend/, backend/
git status
git add .
git commit -m "Your message"
git push
```

You may `cd frontend` or `cd backend` to run `npm` or `python`, but **`git commit` / `git push` apply to the whole monorepo** from the root.

## Quick start

**Frontend** — from the parent folder that contains `Simulation-Studio`, or from this monorepo root use `cd frontend`:

```bash
cd Simulation-Studio/frontend
npm install
npm run dev
```

**Backend** — same idea; from monorepo root use `cd backend`:

```bash
cd Simulation-Studio/backend
python -m venv .venv && .venv/bin/pip install -r requirements.txt   # first-time setup
.venv/bin/python main.py
```

See `frontend/README.md` and `backend/README.md` for details.
