-- "Example Site": sample data so technicians can see how a site looks, try search and the map link.
--
-- Safe to run more than once: rows have fixed ids and are skipped if they already exist.
-- To remove it later (equipment, reading types, entries and readings go with it by cascade):
--   delete from public.sites where id = 'e8000000-0000-4000-8000-000000000001';
--
-- Contents: 1 site, 4 pieces of equipment, 6 reading types, 5 entries, 30 readings.
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

-- Expect: 1 site, 4 equipment, 6 reading types, 5 entries, 30 readings.
select
  (select count(*) from public.sites where id = 'e8000000-0000-4000-8000-000000000001') as sites,
  (select count(*) from public.equipment where site_id = 'e8000000-0000-4000-8000-000000000001') as equipment,
  (select count(*) from public.reading_types rt join public.equipment e on e.id = rt.equipment_id
     where e.site_id = 'e8000000-0000-4000-8000-000000000001') as reading_types,
  (select count(*) from public.reading_sessions where site_id = 'e8000000-0000-4000-8000-000000000001') as entries,
  (select count(*) from public.readings r join public.reading_sessions rs on rs.id = r.session_id
     where rs.site_id = 'e8000000-0000-4000-8000-000000000001') as readings;
