-- Removes "(Warwick Locations)" from checklist wording ("Respiratory Protection (Warwick Locations)"
-- becomes "Respiratory Protection"). The app's standard list no longer has it; this fixes the copies
-- already saved: each site's own list, which its future checklists start from, and every existing
-- checklist. Safe to run twice. Run once per client, in the Supabase SQL editor of that client's project,
-- after 0001 to 0003.

update public.site_checklist_items
set section    = regexp_replace(section,    '\s*\(Warwick Locations\)', '', 'gi'),
    group_name = regexp_replace(group_name, '\s*\(Warwick Locations\)', '', 'gi'),
    label      = regexp_replace(label,      '\s*\(Warwick Locations\)', '', 'gi')
where concat_ws(' ', section, group_name, label) ~* '\(Warwick Locations\)';

update public.checklist_items
set section    = regexp_replace(section,    '\s*\(Warwick Locations\)', '', 'gi'),
    group_name = regexp_replace(group_name, '\s*\(Warwick Locations\)', '', 'gi'),
    label      = regexp_replace(label,      '\s*\(Warwick Locations\)', '', 'gi')
where concat_ws(' ', section, group_name, label) ~* '\(Warwick Locations\)';
