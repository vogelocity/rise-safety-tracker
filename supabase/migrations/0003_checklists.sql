-- Site checklists: each site has its own checklist template; each entry (reading_session) can have one
-- checklist, which keeps its own copy of the items so later template changes never rewrite history.
-- Run once per client, in the Supabase SQL editor of that client's project, after 0001 and 0002.

create table public.site_checklist_items (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.sites on delete cascade,
  section     text not null,
  group_name  text,
  label       text not null,
  kind        text not null default 'check' check (kind in ('check', 'value')),
  unit        text,
  sort_order  int not null default 0,
  created_at  timestamptz default now()
);

create table public.checklists (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null unique references public.reading_sessions on delete cascade,
  deficiencies  text,
  created_at    timestamptz default now()
);

create table public.checklist_items (
  id                uuid primary key default gen_random_uuid(),
  checklist_id      uuid not null references public.checklists on delete cascade,
  template_item_id  uuid references public.site_checklist_items on delete set null,
  section           text not null,
  group_name        text,
  label             text not null,
  kind              text not null default 'check' check (kind in ('check', 'value')),
  unit              text,
  checked           boolean not null default false,
  value             text,
  sort_order        int not null default 0,
  created_at        timestamptz default now()
);

-- checklists.session_id is already indexed by its unique constraint.
create index site_checklist_items_site_id_idx       on public.site_checklist_items (site_id);
create index checklist_items_checklist_id_idx       on public.checklist_items (checklist_id);
create index checklist_items_template_item_id_idx   on public.checklist_items (template_item_id);

alter table public.site_checklist_items  enable row level security;
alter table public.checklists            enable row level security;
alter table public.checklist_items       enable row level security;

create policy "site_checklist_items_select"  on public.site_checklist_items for select to anon, authenticated using (true);
create policy "site_checklist_items_insert"  on public.site_checklist_items for insert to authenticated with check (true);
create policy "site_checklist_items_update"  on public.site_checklist_items for update to authenticated using (true) with check (true);
create policy "site_checklist_items_delete"  on public.site_checklist_items for delete to authenticated using (true);

create policy "checklists_select"  on public.checklists for select to anon, authenticated using (true);
create policy "checklists_insert"  on public.checklists for insert to authenticated with check (true);
create policy "checklists_update"  on public.checklists for update to authenticated using (true) with check (true);
create policy "checklists_delete"  on public.checklists for delete to authenticated using (true);

create policy "checklist_items_select"  on public.checklist_items for select to anon, authenticated using (true);
create policy "checklist_items_insert"  on public.checklist_items for insert to authenticated with check (true);
create policy "checklist_items_update"  on public.checklist_items for update to authenticated using (true) with check (true);
create policy "checklist_items_delete"  on public.checklist_items for delete to authenticated using (true);

-- 0001's "grant ... on all tables" only covered the tables that existed then.
grant select on public.site_checklist_items, public.checklists, public.checklist_items to anon, authenticated;
grant insert, update, delete on public.site_checklist_items, public.checklists, public.checklist_items to authenticated;

-- Creates the checklist for an entry in one transaction and returns its id. Safe to call twice: an
-- existing checklist is returned unchanged. A site with no template (or an emptied one) is first given
-- p_defaults, the standard list sent by the app as a JSON array of
-- {section, group, label, kind, unit}. Security invoker, so RLS applies as for any other write.
create or replace function public.start_checklist(p_session_id uuid, p_defaults jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_site_id uuid;
  v_checklist_id uuid;
begin
  select site_id into v_site_id from reading_sessions where id = p_session_id;
  if v_site_id is null then
    raise exception 'Entry not found.';
  end if;

  -- Serializes checklist starts per site, so two editors cannot seed the template twice.
  perform 1 from sites where id = v_site_id for update;

  select id into v_checklist_id from checklists where session_id = p_session_id;
  if v_checklist_id is not null then
    return v_checklist_id;
  end if;

  if not exists (select 1 from site_checklist_items where site_id = v_site_id) then
    insert into site_checklist_items (site_id, section, group_name, label, kind, unit, sort_order)
    select v_site_id,
           e.item->>'section',
           nullif(e.item->>'group', ''),
           e.item->>'label',
           e.item->>'kind',
           nullif(e.item->>'unit', ''),
           (e.ord - 1)::int
    from jsonb_array_elements(p_defaults) with ordinality as e(item, ord);
  end if;

  insert into checklists (session_id) values (p_session_id) returning id into v_checklist_id;

  insert into checklist_items (checklist_id, template_item_id, section, group_name, label, kind, unit, sort_order)
  select v_checklist_id, t.id, t.section, t.group_name, t.label, t.kind, t.unit, t.sort_order
  from site_checklist_items t
  where t.site_id = v_site_id;

  return v_checklist_id;
end;
$$;

revoke execute on function public.start_checklist(uuid, jsonb) from public, anon;
grant execute on function public.start_checklist(uuid, jsonb) to authenticated;
