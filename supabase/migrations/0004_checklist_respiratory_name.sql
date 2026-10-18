-- Renames the checklist section "Respiratory Protection (Warwick Locations)" to "Respiratory Protection"
-- everywhere: each site's own list (so future checklists use the new name) and every saved checklist.
-- Run once per client, in the Supabase SQL editor of that client's project, after 0003. Safe to run twice.

update public.site_checklist_items
set section = 'Respiratory Protection'
where section = 'Respiratory Protection (Warwick Locations)';

update public.checklist_items
set section = 'Respiratory Protection'
where section = 'Respiratory Protection (Warwick Locations)';
