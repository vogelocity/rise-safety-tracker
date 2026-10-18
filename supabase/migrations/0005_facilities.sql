-- Facilities: each site belongs to one facility. Existing sites keep facility_id null until they are
-- assigned; the app lists them under "No facility". A facility cannot be deleted while it has sites.
-- Run once per client, in the Supabase SQL editor of that client's project, after 0001 to 0004.

create table public.facilities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (btrim(name) <> ''),
  created_at  timestamptz default now()
);

-- One facility per name, ignoring case and surrounding spaces, so lists can be loaded by name.
create unique index facilities_name_key on public.facilities (lower(btrim(name)));

alter table public.sites
  add column facility_id uuid references public.facilities on delete restrict;

create index sites_facility_id_idx on public.sites (facility_id);

alter table public.facilities enable row level security;

create policy "facilities_select"  on public.facilities for select to anon, authenticated using (true);
create policy "facilities_insert"  on public.facilities for insert to authenticated with check (true);
create policy "facilities_update"  on public.facilities for update to authenticated using (true) with check (true);
create policy "facilities_delete"  on public.facilities for delete to authenticated using (true);

-- 0001's "grant ... on all tables" only covered the tables that existed then.
grant select on public.facilities to anon, authenticated;
grant insert, update, delete on public.facilities to authenticated;
