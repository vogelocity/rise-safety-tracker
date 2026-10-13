-- Rise Safety — Site Equipment Readings Tracker
-- Initial schema, Row Level Security, and grants.
-- Run once per client, in the Supabase SQL editor of that client's project.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.sites (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  site_type   text,
  notes       text,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

create table public.equipment (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid references public.sites on delete cascade,
  name        text not null,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

create table public.reading_types (
  id            uuid primary key default gen_random_uuid(),
  equipment_id  uuid references public.equipment on delete cascade,
  name          text not null,   -- e.g. "Ohms", "Voltage", "Pressure"
  unit          text,            -- e.g. "Ω", "V", "psi" (display only)
  sort_order    int default 0,
  created_at    timestamptz default now()
);

create table public.reading_sessions (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid references public.sites on delete cascade,
  reading_date  date not null,
  technician    text,
  notes         text,
  created_at    timestamptz default now(),
  unique (site_id, reading_date)  -- one session per site per day; "update in place" relies on this
);

create table public.readings (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid references public.reading_sessions on delete cascade,
  reading_type_id  uuid references public.reading_types on delete cascade,
  value            text not null,  -- TEXT on purpose: "<1", "0.3", "N/A", "OL"
  created_at       timestamptz default now(),
  unique (session_id, reading_type_id)
);

-- Foreign keys are not indexed automatically in Postgres; these keep lookups and cascades fast.
create index equipment_site_id_idx            on public.equipment (site_id);
create index reading_types_equipment_id_idx   on public.reading_types (equipment_id);
create index reading_sessions_site_id_idx     on public.reading_sessions (site_id);
create index readings_session_id_idx          on public.readings (session_id);
create index readings_reading_type_id_idx     on public.readings (reading_type_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   select:                  anon + authenticated (read-only viewers need no login)
--   insert / update / delete: authenticated only (the shared editor login)
-- ---------------------------------------------------------------------------

alter table public.sites             enable row level security;
alter table public.equipment         enable row level security;
alter table public.reading_types     enable row level security;
alter table public.reading_sessions  enable row level security;
alter table public.readings          enable row level security;

create policy "sites_select"  on public.sites for select to anon, authenticated using (true);
create policy "sites_insert"  on public.sites for insert to authenticated with check (true);
create policy "sites_update"  on public.sites for update to authenticated using (true) with check (true);
create policy "sites_delete"  on public.sites for delete to authenticated using (true);

create policy "equipment_select"  on public.equipment for select to anon, authenticated using (true);
create policy "equipment_insert"  on public.equipment for insert to authenticated with check (true);
create policy "equipment_update"  on public.equipment for update to authenticated using (true) with check (true);
create policy "equipment_delete"  on public.equipment for delete to authenticated using (true);

create policy "reading_types_select"  on public.reading_types for select to anon, authenticated using (true);
create policy "reading_types_insert"  on public.reading_types for insert to authenticated with check (true);
create policy "reading_types_update"  on public.reading_types for update to authenticated using (true) with check (true);
create policy "reading_types_delete"  on public.reading_types for delete to authenticated using (true);

create policy "reading_sessions_select"  on public.reading_sessions for select to anon, authenticated using (true);
create policy "reading_sessions_insert"  on public.reading_sessions for insert to authenticated with check (true);
create policy "reading_sessions_update"  on public.reading_sessions for update to authenticated using (true) with check (true);
create policy "reading_sessions_delete"  on public.reading_sessions for delete to authenticated using (true);

create policy "readings_select"  on public.readings for select to anon, authenticated using (true);
create policy "readings_insert"  on public.readings for insert to authenticated with check (true);
create policy "readings_update"  on public.readings for update to authenticated using (true) with check (true);
create policy "readings_delete"  on public.readings for delete to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Grants (newer Supabase projects do not auto-grant Data API access on new tables)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
