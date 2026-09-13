-- Map schema. Every table is prefixed with map_.
-- Run this once in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- One row per driving session.
create table if not exists public.map_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  label         text,
  distance_m    double precision not null default 0,
  point_count   integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists map_sessions_user_started_idx
  on public.map_sessions (user_id, started_at desc);

-- One row per GPS fix recorded during a session.
create table if not exists public.map_session_points (
  id           bigint generated always as identity primary key,
  session_id   uuid not null references public.map_sessions (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  recorded_at  timestamptz not null,
  latitude     double precision not null,
  longitude    double precision not null,
  accuracy_m   double precision,
  altitude_m   double precision,
  speed_mps    double precision,
  heading_deg  double precision
);

create index if not exists map_session_points_session_idx
  on public.map_session_points (session_id, recorded_at);

alter table public.map_sessions       enable row level security;
alter table public.map_session_points enable row level security;

-- Single-user app, but RLS keeps the anon key from ever reading someone else's rows.
drop policy if exists map_sessions_owner on public.map_sessions;
create policy map_sessions_owner on public.map_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists map_session_points_owner on public.map_session_points;
create policy map_session_points_owner on public.map_session_points
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
