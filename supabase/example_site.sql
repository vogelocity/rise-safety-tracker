-- "Example Site": sample data so technicians can see how a site looks, try search and the map link.
--
-- Safe to run more than once: rows have fixed ids and are skipped if they already exist.
-- Needs migrations 0001 to 0003 (0003 adds the checklist tables).
-- To remove it later (equipment, reading types, entries, readings and checklists go with it by cascade):
--   delete from public.sites where id = 'e8000000-0000-4000-8000-000000000001';
--
-- Contents: 1 site, 4 pieces of equipment, 6 reading types, 5 entries, 30 readings, the site's checklist
-- list (the standard 37 items) and a filled-in checklist for each entry.
-- Values include "<1" and "OL" on purpose, because readings are text.

insert into public.sites (id, name, site_type, notes, map_url, sort_order) values
  ('e8000000-0000-4000-8000-000000000001', 'Example Site', 'Well pad',
   'Sample data for training. Not a real site.',
   'https://www.google.com/maps/search/?api=1&query=29.216971,-97.944866', 0)
on conflict (id) do nothing;

insert into public.equipment (id, site_id, name, sort_order) values
  ('e8000000-0000-4000-8000-100000000001', 'e8000000-0000-4000-8000-000000000001', 'Light Plant 1', 1),
  ('e8000000-0000-4000-8000-100000000002', 'e8000000-0000-4000-8000-000000000001', 'Light Plant 2', 2),
  ('e8000000-0000-4000-8000-100000000003', 'e8000000-0000-4000-8000-000000000001', 'Generator 1',   3),
  ('e8000000-0000-4000-8000-100000000004', 'e8000000-0000-4000-8000-000000000001', 'Tank Heater',   4)
on conflict (id) do nothing;

insert into public.reading_types (id, equipment_id, name, unit, sort_order) values
  ('e8000000-0000-4000-8000-200000000001', 'e8000000-0000-4000-8000-100000000001', 'Ohms',        'Ω',  1),
  ('e8000000-0000-4000-8000-200000000002', 'e8000000-0000-4000-8000-100000000002', 'Ohms',        'Ω',  1),
  ('e8000000-0000-4000-8000-200000000003', 'e8000000-0000-4000-8000-100000000003', 'Voltage',     'V',  1),
  ('e8000000-0000-4000-8000-200000000004', 'e8000000-0000-4000-8000-100000000003', 'Amps',        'A',  2),
  ('e8000000-0000-4000-8000-200000000005', 'e8000000-0000-4000-8000-100000000003', 'Ohms',        'Ω',  3),
  ('e8000000-0000-4000-8000-200000000006', 'e8000000-0000-4000-8000-100000000004', 'Temperature', '°F', 1)
on conflict (id) do nothing;

insert into public.reading_sessions (id, site_id, reading_date, technician, notes) values
  ('e8000000-0000-4000-8000-300000000001', 'e8000000-0000-4000-8000-000000000001', '2026-06-12', 'J. Ramirez', null),
  ('e8000000-0000-4000-8000-300000000002', 'e8000000-0000-4000-8000-000000000001', '2026-07-14', 'J. Ramirez', null),
  ('e8000000-0000-4000-8000-300000000003', 'e8000000-0000-4000-8000-000000000001', '2026-08-11', 'K. Nguyen',  'Light Plant 2 ground clamp loose; retightened.'),
  ('e8000000-0000-4000-8000-300000000004', 'e8000000-0000-4000-8000-000000000001', '2026-09-15', 'K. Nguyen',  null),
  ('e8000000-0000-4000-8000-300000000005', 'e8000000-0000-4000-8000-000000000001', '2026-10-13', 'J. Ramirez', 'Generator 1 off for service; no load.')
on conflict (id) do nothing;

-- One row per entry and reading type: Light Plant 1, Light Plant 2, Generator V, A, Ohms, Tank Heater °F.
insert into public.readings (session_id, reading_type_id, value)
select ('e8000000-0000-4000-8000-30000000000' || s)::uuid, ('e8000000-0000-4000-8000-20000000000' || t)::uuid, v
from (values
  (1, 1, '0.4'), (1, 2, '0.6'), (1, 3, '242'), (1, 4, '18.2'), (1, 5, '0.3'), (1, 6, '148'),
  (2, 1, '0.5'), (2, 2, '0.7'), (2, 3, '240'), (2, 4, '19.0'), (2, 5, '<1'),  (2, 6, '151'),
  (3, 1, '0.4'), (3, 2, '2.8'), (3, 3, '241'), (3, 4, '17.6'), (3, 5, '0.3'), (3, 6, '149'),
  (4, 1, '0.4'), (4, 2, '0.6'), (4, 3, '243'), (4, 4, '18.4'), (4, 5, '0.2'), (4, 6, '150'),
  (5, 1, '0.5'), (5, 2, '0.6'), (5, 3, '0'),   (5, 4, '0'),    (5, 5, 'OL'),  (5, 6, '147')
) as r(s, t, v)
on conflict (session_id, reading_type_id) do nothing;

-- Checklists. The standard list from src/lib/checklistDefaults.ts, numbered 1 to 37 in display order.
drop table if exists example_checklist;
create temp table example_checklist (n int, section text, group_name text, label text, kind text, unit text);
insert into example_checklist values
  ( 1, 'Gas Detection System', 'Sensor Batteries', 'Check all sensor battery levels', 'check', null),
  ( 2, 'Gas Detection System', 'Sensor Batteries', 'Replace low batteries as needed', 'check', null),
  ( 3, 'Gas Detection System', 'Sensor Batteries', 'Confirm proper installation and secure battery covers', 'check', null),
  ( 4, 'Gas Detection System', 'Battery Packs (Visual Inspection)', 'No corrosion on terminals', 'check', null),
  ( 5, 'Gas Detection System', 'Battery Packs (Visual Inspection)', 'No swelling or physical damage', 'check', null),
  ( 6, 'Gas Detection System', 'Battery Packs (Visual Inspection)', 'Wiring secure and intact', 'check', null),
  ( 7, 'Gas Detection System', 'Battery Packs (Visual Inspection)', 'No loose connections', 'check', null),
  ( 8, 'Gas Detection System', 'Main Monitor', 'Monitor powered on', 'check', null),
  ( 9, 'Gas Detection System', 'Main Monitor', 'No fault codes present', 'check', null),
  (10, 'Gas Detection System', 'Main Monitor', 'Display functioning properly', 'check', null),
  (11, 'Gas Detection System', 'Main Monitor', 'Alarms (audible/visual) operational', 'check', null),
  (12, 'Gas Detection System', 'Monitor Battery Condition', 'Battery charge level acceptable', 'check', null),
  (13, 'Gas Detection System', 'Monitor Battery Condition', 'Charging system functioning', 'check', null),
  (14, 'Gas Detection System', 'Monitor Battery Condition', 'No battery damage or overheating', 'check', null),
  (15, 'Safety Equipment', 'Windsock', 'Properly mounted', 'check', null),
  (16, 'Safety Equipment', 'Windsock', 'No tears or excessive wear', 'check', null),
  (17, 'Safety Equipment', 'Windsock', 'Rotates freely with wind', 'check', null),
  (18, 'Safety Equipment', 'Windsock', 'Clearly visible', 'check', null),
  (19, 'Respiratory Protection (Warwick Locations)', 'SCBAs', 'Units present at designated locations', 'check', null),
  (20, 'Respiratory Protection (Warwick Locations)', 'SCBAs', 'Cylinders full (record PSI below)', 'check', null),
  (21, 'Respiratory Protection (Warwick Locations)', 'SCBAs', 'No physical damage', 'check', null),
  (22, 'Respiratory Protection (Warwick Locations)', 'SCBAs', 'Straps, harness, and facepieces in good condition', 'check', null),
  (23, 'Respiratory Protection (Warwick Locations)', 'SCBAs', 'PASS device operational', 'check', null),
  (24, 'Respiratory Protection (Warwick Locations)', 'SCBAs', 'Expiration dates checked', 'check', null),
  (25, 'Respiratory Protection (Warwick Locations)', 'Cylinder PSI Readings', 'Unit 1', 'value', 'PSI'),
  (26, 'Respiratory Protection (Warwick Locations)', 'Cylinder PSI Readings', 'Unit 2', 'value', 'PSI'),
  (27, 'Respiratory Protection (Warwick Locations)', 'Cylinder PSI Readings', 'Unit 3', 'value', 'PSI'),
  (28, 'Respiratory Protection (Warwick Locations)', 'Cylinder PSI Readings', 'Additional', 'value', null),
  (29, 'Cascade System', null, 'Cascade bottles present', 'check', null),
  (30, 'Cascade System', null, 'Bottles properly secured', 'check', null),
  (31, 'Cascade System', null, 'No visible damage or corrosion', 'check', null),
  (32, 'Cascade System', null, 'Valves operational', 'check', null),
  (33, 'Cascade System', null, 'Hoses and fittings intact', 'check', null),
  (34, 'Cascade System', 'Bottle PSI Readings', 'Bottle 1', 'value', 'PSI'),
  (35, 'Cascade System', 'Bottle PSI Readings', 'Bottle 2', 'value', 'PSI'),
  (36, 'Cascade System', 'Bottle PSI Readings', 'Bottle 3', 'value', 'PSI'),
  (37, 'Cascade System', 'Bottle PSI Readings', 'Additional', 'value', null);

-- The site's own list, so new entries at Example Site start from it. Skipped if an editor already gave
-- the site a list in the app.
insert into public.site_checklist_items (id, site_id, section, group_name, label, kind, unit, sort_order)
select ('e8000000-0000-4000-8000-4000000000' || lpad(c.n::text, 2, '0'))::uuid,
       'e8000000-0000-4000-8000-000000000001', c.section, c.group_name, c.label, c.kind, c.unit, c.n - 1
from example_checklist c
where not exists (
  select 1 from public.site_checklist_items x
  where x.site_id = 'e8000000-0000-4000-8000-000000000001'
    and x.id::text not like 'e8000000-0000-4000-8000-4%')
on conflict (id) do nothing;

-- One checklist per entry. Skipped for an entry that already has one (made in the app).
insert into public.checklists (id, session_id, deficiencies) values
  ('e8000000-0000-4000-8000-500000000001', 'e8000000-0000-4000-8000-300000000001', null),
  ('e8000000-0000-4000-8000-500000000002', 'e8000000-0000-4000-8000-300000000002',
   '1. Windsock torn at the seam. Replacement ordered.'),
  ('e8000000-0000-4000-8000-500000000003', 'e8000000-0000-4000-8000-300000000003',
   E'1. SCBA Unit 2 cylinder at 1800 PSI. Swapped with the spare; refill scheduled.\n2. Windsock replaced.'),
  ('e8000000-0000-4000-8000-500000000004', 'e8000000-0000-4000-8000-300000000004', null),
  ('e8000000-0000-4000-8000-500000000005', 'e8000000-0000-4000-8000-300000000005',
   '1. Light corrosion on the battery pack terminals at sensor 3. Cleaned; recheck next visit.')
on conflict do nothing;

-- Every item on every checklist. Checkboxes are ticked except the ones the deficiencies explain:
-- entry 2 "No tears or excessive wear" (16), entry 3 "Cylinders full" (20), entry 5 "No corrosion on terminals" (4).
insert into public.checklist_items
  (id, checklist_id, template_item_id, section, group_name, label, kind, unit, checked, value, sort_order)
select ('e8000000-0000-4000-8000-6' || e.s || '000000' || lpad(c.n::text, 4, '0'))::uuid,
       ('e8000000-0000-4000-8000-50000000000' || e.s)::uuid,
       (select t.id from public.site_checklist_items t
        where t.id = ('e8000000-0000-4000-8000-4000000000' || lpad(c.n::text, 2, '0'))::uuid),
       c.section, c.group_name, c.label, c.kind, c.unit,
       c.kind = 'check' and (e.s, c.n) not in ((2, 16), (3, 20), (5, 4)),
       v.value,
       c.n - 1
from example_checklist c
cross join (values (1), (2), (3), (4), (5)) as e(s)
left join (values
  (1, 25, '2200'), (1, 26, '2150'),  (1, 27, '2250'), (1, 34, '5900'), (1, 35, '6000'), (1, 36, '5950'),
  (2, 25, '2200'), (2, 26, '2200'),  (2, 27, '2100'), (2, 34, '5850'), (2, 35, '5900'), (2, 36, '5900'),
  (3, 25, '2150'), (3, 26, '1800'),  (3, 27, '2200'), (3, 34, '5800'), (3, 35, '5850'), (3, 36, '5800'),
  (4, 25, '2200'), (4, 26, '2250'),  (4, 27, '2200'), (4, 28, 'N/A'),  (4, 34, '6000'), (4, 35, '6000'), (4, 36, '5950'),
  (5, 25, '2200'), (5, 26, '~2200'), (5, 27, '2150'), (5, 34, '5950'), (5, 35, '5900'), (5, 36, '5950')
) as v(s, n, value) on v.s = e.s and v.n = c.n
where exists (
  select 1 from public.checklists k where k.id = ('e8000000-0000-4000-8000-50000000000' || e.s)::uuid)
on conflict (id) do nothing;

drop table example_checklist;

-- Expect: 1 site, 4 equipment, 6 reading types, 5 entries, 30 readings,
-- 37 site checklist items, 5 checklists, 185 checklist items.
select
  (select count(*) from public.sites where id = 'e8000000-0000-4000-8000-000000000001') as sites,
  (select count(*) from public.equipment where site_id = 'e8000000-0000-4000-8000-000000000001') as equipment,
  (select count(*) from public.reading_types rt join public.equipment e on e.id = rt.equipment_id
     where e.site_id = 'e8000000-0000-4000-8000-000000000001') as reading_types,
  (select count(*) from public.reading_sessions where site_id = 'e8000000-0000-4000-8000-000000000001') as entries,
  (select count(*) from public.readings r join public.reading_sessions rs on rs.id = r.session_id
     where rs.site_id = 'e8000000-0000-4000-8000-000000000001') as readings,
  (select count(*) from public.site_checklist_items
     where site_id = 'e8000000-0000-4000-8000-000000000001') as site_checklist_items,
  (select count(*) from public.checklists k join public.reading_sessions rs on rs.id = k.session_id
     where rs.site_id = 'e8000000-0000-4000-8000-000000000001') as checklists,
  (select count(*) from public.checklist_items ci join public.checklists k on k.id = ci.checklist_id
     join public.reading_sessions rs on rs.id = k.session_id
     where rs.site_id = 'e8000000-0000-4000-8000-000000000001') as checklist_items;
