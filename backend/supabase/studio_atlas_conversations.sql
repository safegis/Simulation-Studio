-- SafeGIS Simulation Studio — Atlas chat history (run in Supabase SQL Editor)
-- Postgres schema used by the Simulation Studio Python backend (FastAPI) via Supabase.
--
-- REQUIRED: Run this whole file once on your project (Dashboard → SQL → New query → Run).
-- If you skip this, GET /api/atlas-chat/conversations returns PGRST205 (table not in schema cache).

create table if not exists public.studio_atlas_conversations (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null,
  title text,
  langgraph_history jsonb not null default '[]'::jsonb,
  ui_messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists studio_atlas_conversations_owner_updated_idx
  on public.studio_atlas_conversations (owner_key, updated_at desc);

comment on table public.studio_atlas_conversations is 'Atlas (LangGraph) chat threads for Simulation Studio; owner_key is auth user id or guest UUID.';

-- Optional: tighten access if you later query with the anon key from the browser.
-- Service role (used by the Simulation Studio backend) bypasses RLS.
alter table public.studio_atlas_conversations enable row level security;

-- Keep updated_at fresh on PATCH (backend also sets it explicitly).
create or replace function public.studio_atlas_conversations_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists studio_atlas_conversations_updated_at on public.studio_atlas_conversations;
create trigger studio_atlas_conversations_updated_at
  before update on public.studio_atlas_conversations
  for each row execute function public.studio_atlas_conversations_set_updated_at();
