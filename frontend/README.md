<div align="center">
  <h1>SafeGIS - Simulation Studio</h1>
</div>

> **Monorepo:** This app lives under `frontend/` in the Simulation-Studio repo. **Use Git only from the repository root** (parent folder that contains `frontend/`, `backend/`, and `.git`) — see the root [`README.md`](../README.md#git-workflow).

### 🧐 I. Overview

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Run the frontend (development)

From the directory that contains `Simulation-Studio` (e.g. the SafeGIS repo root):

```bash
cd Simulation-Studio/frontend
npm run dev
```

If you are **already** at the Simulation-Studio monorepo root (the folder that contains `frontend/` and `backend/`):

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Atlas chat history (Supabase via Simulation Studio backend)

Conversations are stored in **Supabase Postgres** (table `studio_atlas_conversations`). The **Python backend** (`../backend`) exposes `GET`/`POST` `/api/atlas-chat/conversations` and `GET`/`PATCH`/`DELETE` `/api/atlas-chat/conversations/{id}` using the **service role** there — not Next.js.

1. In the Supabase SQL editor, run [`../backend/supabase/studio_atlas_conversations.sql`](../backend/supabase/studio_atlas_conversations.sql) (once).
2. **`frontend/.env`:** `NEXT_PUBLIC_BACKEND_ENDPOINT` (e.g. `http://localhost:8000`). For signed-in users, also set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same project as Official Website).
3. **`backend/.env`:** `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`), `SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`), and `SUPABASE_SERVICE_ROLE_KEY` — see `backend/.env.example`.

The browser sends either a Supabase **access token** (`Authorization: Bearer …`) or a **guest UUID** in `x-studio-owner-key` (`localStorage` key `safegis_studio_atlas_owner_key`).

### Other package managers

```bash
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
