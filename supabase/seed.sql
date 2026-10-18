-- Rise Safety: demo data for development and screenshots.
--
-- !!! NEVER run this against a client's production database. !!!
-- Run it only in the dev Supabase project, in the SQL editor.
--
-- Safe to run more than once: rows have fixed ids and are skipped if they already exist.
-- Needs migrations 0001 to 0005 (0005 adds facilities).
-- To remove the demo data later, the sites first, then the facility (it cannot be deleted while it has sites):
--   delete from public.sites where id in
--     ('a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002');
--   delete from public.facilities where id = 'f1000000-0000-4000-8000-000000000001';
-- (equipment, reading types, sessions and readings are removed by cascade).
--
-- Contents: 1 facility (North Field) holding 2 sites, 6 pieces of equipment, 3 sessions, 12 readings.
-- Values include "<1", "OL" and "N/A" on purpose, because readings are text.
-- One reading is left blank (Alpha Yard, Sep 12, Generator Voltage), so that history cell is empty.

insert into public.facilities (id, name) values
  ('f1000000-0000-4000-8000-000000000001', 'North Field')
on conflict (id) do nothing;

insert into public.sites (id, name, site_type, notes, sort_order) values
  ('a1000000-0000-4000-8000-000000000001', 'Alpha Yard', 'Tank battery', 'Gate code is on the sign by the office trailer.', 1),
  ('a1000000-0000-4000-8000-000000000002', 'Bravo Pad', 'Well pad', null, 2)
on conflict (id) do nothing;

-- Only sites with no facility are moved, so running this again never pulls a site out of a facility
-- someone put it in.
update public.sites set facility_id = 'f1000000-0000-4000-8000-000000000001'
where id in ('a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002')
  and facility_id is null;

insert into public.equipment (id, site_id, name, sort_order) values
  ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Light Plant 1',     1),
  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'Light Plant 2',     2),
  ('b1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', 'Generator',         3),
  ('b1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000001', 'Grounding Station', 4),
  ('b1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000002', 'Wellhead',          1),
  ('b1000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000002', 'Separator',         2)
on conflict (id) do nothing;

insert into public.reading_types (id, equipment_id, name, unit, sort_order) values
  ('c1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'Ohms',     'Ω',   1),
  ('c1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000002', 'Ohms',     'Ω',   1),
  ('c1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000003', 'Ohms',     'Ω',   1),
  ('c1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000003', 'Voltage',  'V',   2),
  ('c1000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000004', 'Ohms',     'Ω',   1),
  ('c1000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000005', 'Ohms',     'Ω',   1),
  ('c1000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000006', 'Ohms',     'Ω',   1),
  ('c1000000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000006', 'Pressure', 'psi', 2)
on conflict (id) do nothing;

insert into public.reading_sessions (id, site_id, reading_date, technician, notes) values
  ('d1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '2026-08-14', 'Zach Riser', null),
  ('d1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', '2026-09-12', 'Will Vogel', 'Rain the night before.'),
  ('d1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002', '2026-09-12', 'Zach Riser', null)
on conflict (id) do nothing;

insert into public.readings (session_id, reading_type_id, value) values
  -- Alpha Yard, Aug 14: all five reading types
  ('d1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', '0.4'),
  ('d1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000002', '0.6'),
  ('d1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000003', '1.2'),
  ('d1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000004', '480'),
  ('d1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', '0.3'),
  -- Alpha Yard, Sep 12: Generator Voltage left blank, so no row
  ('d1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', '<1'),
  ('d1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000002', '0.5'),
  ('d1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000003', 'OL'),
  ('d1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000005', '0.3'),
  -- Bravo Pad, Sep 12
  ('d1000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000006', '2.1'),
  ('d1000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000007', 'N/A'),
  ('d1000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000008', '125')
on conflict (session_id, reading_type_id) do nothing;
