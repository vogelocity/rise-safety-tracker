Read `README.md` in full. Work in this folder. Phases 1 to 10 are done and committed on `main`, followed by the rename commit `Checklist: rename "Respiratory Protection (Warwick Locations)" to "Respiratory Protection"`. Run `git log --oneline -6` and confirm that commit is in the list before you start. The app is live for a real client (Verdun Oil Company). This phase groups sites into facilities and does nothing else.

## If this is a restart
This phase commits after each part (commit messages are given below). If `git log` already shows some of them, a previous session got partway. Skip the committed parts, run `npm.cmd run build` to confirm the tree is clean, and continue with the next part. Do not redo committed work.

## Rules for this session
- **Never run `npm run dev`, `vite` or `npm run preview` in Bash or PowerShell.** They never exit and the session hangs. Start the dev server only with the Browser pane's `preview_start`, using the `dev` configuration in `.claude/launch.json`.
- `npm install` is not needed (this phase adds no package). If you must run it, use `run_in_background` or a 5-minute timeout. On PowerShell use `npm.cmd`.
- Create and change files with the Write and Edit tools. Long heredocs in the Bash tool fail.
- When you need Will (paste SQL, type the password, run the RLS check), ask once with exact steps, then end your turn. Do not poll or retry while you wait.
- If a tool or command fails twice the same way, stop and report what failed. Do not invent workarounds.
- Commit after each part, with the message given. Do not push: pushing deploys straight to Verdun's live site, and the database change has to reach Verdun's project first.

## Before writing any code
In one paragraph, tell me how you will verify this phase. Then start.

## Why
Verdun has 12 facilities with about 80 sites under each, so roughly 960 sites. One flat list of 960 sites is unusable on a phone. Sites get grouped by facility: the home page lists facilities, and a facility lists only its own sites. Everything from the site page on stays as it is.

## How it works (the design)
- **Home page (`/`) lists facilities.** Banner: eyebrow `Facility index`, title `Facilities`, subtitle `Select a facility to see its sites`. Actions: `Export CSV` (everyone) and `+ Add facility` (editors). Below the banner: the label `All facilities` and a search box. The table has one row per facility: its name, its site count (`82 sites`, `1 site`, `0 sites`), an arrow, and for editors an `Edit` button. Rows are sorted by name with numbers in natural order (`Facility 2` before `Facility 10`).
- **Sites with no facility.** Sites that exist before this phase have no facility until they are assigned. While any exist, the facilities table ends with one more row, `No facility`, in muted text, with its count and no `Edit`. It opens `/facilities/unassigned`. When every site has a facility, the row is gone. With no facilities and no sites at all, the card says `No facilities yet.`; with no facilities but some unassigned sites, it shows the `No facility` row alone.
- **Search on the home page** finds facilities by name and sites by name or type, as you type, ignoring case. The box is shown when there is at least one facility or one site. Its placeholder and aria-label are `Search facilities and sites`. With a query, the page shows two blocks in place of the facilities table:
  - `Facilities`: the matching facilities, in the same table (without the `No facility` row), or `No facilities match “…”.`
  - `Sites`: the matching sites from every facility, with columns Site, Type, Facility and an arrow; each row opens the site page. Sites with no facility show `No facility` in the Facility column. Sorted by site name, natural order. At most 50 rows; when there are more, a line under the table says `Showing 50 of N. Keep typing to narrow it down.` With no match: `No sites match “…”.`
  - Clearing the box brings the facilities table back. The query is not remembered between visits (same as today).
- **Facility page (`/facilities/:facilityId`)** is today's Sites page, limited to that facility's sites. Banner: eyebrow `Facility`, title the facility name, subtitle the count (`82 sites`). Actions: `← Back to facilities` (to `/`), and for editors `Edit facility` and `+ Add site`. Below: the label `Sites at <facility name>`, the same search box as today (`Search sites`, filters by name or type), and the same `SitesTable` with the same columns and `Edit` buttons. Sites are sorted by name, natural order (`Pad 2` before `Pad 10`), not by `sort_order`: with about 80 sites per facility, name order is the one people can scan. An id that is not a facility shows `← Back to facilities` and `Facility not found.`
- **The `No facility` page (`/facilities/unassigned`)** is the same page for sites with no facility. Title `No facility`, subtitle `Sites that are not in a facility yet. Use Edit to move each one into a facility.` It has `← Back to facilities` but no `Edit facility` and no `+ Add site`.
- **Adding and editing sites.** `+ Add site` lives only on a facility page. The site dialog (add and edit, on the facility page and on the site page) gets a required `Facility` dropdown as its second field, after Name. Its options are all facilities, sorted as on the home page, with a first blank option `Choose a facility`. When adding, it is preset to the facility whose page you are on. When editing, it is preset to the site's facility, or blank for a site with no facility. Saving blank shows the dialog's usual `Facility is required.` Changing it moves the site: after `Site saved`, a moved site disappears from the facility page it was on.
- **Facilities are added, renamed and deleted by editors.** A facility has a name and nothing else. `+ Add facility` and `Edit` / `Edit facility` open a one-field dialog (`Name`, required); the edit dialog has `Delete facility` on the left. Toasts: `Facility added`, `Facility saved`, `Facility deleted`. Two facilities cannot have the same name, ignoring case and surrounding spaces; trying shows the error toast `A facility named "<name>" already exists.` and keeps the dialog open.
- **A facility with sites cannot be deleted.** Clicking `Delete facility` on a facility that has sites shows the error toast `"<name>" still has <N> site(s). Move them to another facility or delete them first.` (use `site` or `sites` to match N) and keeps the edit dialog open. With 0 sites it opens a confirmation: title `Delete facility?`, message `Delete "<name>"? It has no sites. This cannot be undone.`, button `Delete facility` (danger). Confirming deletes it and toasts `Facility deleted`; from the facility page it then navigates to `/`. The database also refuses (the foreign key is `on delete restrict`), so a stale count can never delete sites.
- **Site page.** The banner's back button goes to the site's facility and names it: `← Back to <facility name>`, linking to `/facilities/<id>`. A site with no facility gets `← Back to facilities`, linking to `/`. The `Site not found.` and load-error states use `← Back to facilities` (to `/`). Deleting a site navigates to its facility page, or to `/` if it had none. Nothing else on the site page changes.
- **Checklist page.** Only the text of the back link in its not-found and error states changes, from `← Back to sites` to `← Back to facilities` (still to `/`). `← Back to site` in the banner stays.
- **Export CSV** stays on the home page only and still exports every reading. It gains a first column, `Facility` (blank for a site with no facility). Rows sort by facility name (natural order, blank last), then as today.
- **Viewers (logged out)** see facilities and sites read-only, as today. No add, edit or delete control is in the DOM.
- **Loading Verdun's facility list is not part of this phase.** Will has the list of which existing site belongs to which facility, and later a full list of facilities and sites. That load is a separate SQL file prepared outside this repository. Do not write it, and do not add an import screen.

## Part A: database migration
Create `supabase/migrations/0005_facilities.sql` with exactly this content:

```sql
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
```

## Part B: data layer (`src/lib/db.ts`)
Every query stays in this file. Add or change:

1. `Site` gets `facility_id: string | null`.
2. New types:
   ```ts
   export interface Facility { id: string; name: string; created_at: string }
   export interface FacilitySummary extends Facility { site_count: number }
   /** One site as the home page's search needs it: no readings, so 1000 sites stay one cheap request. */
   export interface SiteIndexRow { id: string; name: string; site_type: string | null; facility_id: string | null }
   export interface FacilityIndex { facilities: FacilitySummary[]; unassigned_count: number; sites: SiteIndexRow[] }
   ```
3. A shared comparator for facility and site names: `a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })`. Use it for facilities, for the home page's site matches, and for `listSiteSummaries` (which today sorts with `bySortThenName`). Leave `bySortThenName` itself and its other callers (equipment, reading types) alone.
4. `listFacilities(): Promise<Facility[]>`, sorted by name.
5. `getFacility(id): Promise<Facility | null>`, with the same `UUID_RE` guard as `getSite`.
6. `listFacilityIndex(): Promise<FacilityIndex>`: all facilities and all sites (`id, name, site_type, facility_id`, through `fetchAll`), counted in the browser. Facilities sorted by name, sites sorted by name.
7. `listSiteSummaries(facilityId: string | null)`: today's function, limited to one facility (`null` means sites with no facility, using `.is('facility_id', null)`), sorted by name as in item 3. A non-null id that fails `UUID_RE` returns `[]` without a query (Postgres rejects a malformed uuid with an error, which would turn "not found" into a load error). It must not fetch every session in the database any more: after loading the facility's sites, fetch their sessions with `.in('site_id', ids)` in chunks of 50, the way `listReadings` chunks. Drop `equipment_count` and the equipment query: nothing reads it (confirm with a search of `src/` first; if something does, keep it and chunk that query the same way).
8. `createFacility(name)`, `renameFacility(id, name)`, `deleteFacility(id)`, following the patterns of the site functions (`requireName(name, 'Facility')`, `.select()` after writes, `expectRows`). Translate two Postgres errors into the messages from the design: code `23505` on insert or update becomes `A facility named "<trimmed name>" already exists.`; code `23503` on delete becomes `This facility still has sites. Move them to another facility or delete them first.`
9. `SiteInput` gets `facility_id: string`. `createSite` and `updateSite` write it, and throw `Facility is required.` when it is blank.
10. `listAllReadingsForExport` adds the facility name through the embed (`sites(name, sort_order, facilities(name))`), `ExportRow` gets `facility: string`, and the sort puts facility first (natural order, blank last).

Build, then commit: `Facilities: database migration 0005 and data layer`.

## Part C: pages and components
1. `src/components/FieldsDialog.tsx`: `Field` gets an optional `options?: { value: string; label: string }[]`. A field with options renders a `<select>` (same `inputClass`, same label, same required check) whose first option is `<option value="">{f.placeholder ?? 'Choose…'}</option>`. Nothing else in the file changes.
2. `src/components/siteFields.ts`: `SITE_FIELDS` becomes `siteFields(facilities: Facility[]): Field[]`, with `{ name: 'facility_id', label: 'Facility', required: true, placeholder: 'Choose a facility', options }` as the second field. `siteFormValues(site)` includes `facility_id: site.facility_id ?? ''`, and `siteInput` passes it on. The Add dialog's initial values are `{ facility_id: <this facility's id> }`.
3. `src/components/FacilitiesTable.tsx` (new), modeled on `SitesTable.tsx` (same card, header bar, odd/even rows, 56px rows, 44px tap targets, desktop grid and phone layout). Columns: Facility, Sites, arrow, and `Edit` when `onEdit` is passed. Optional props for the trailing `No facility` row (count) and the empty message.
4. `src/components/SiteSearchResults.tsx` (new): the home page's site matches, in the same card style. Columns Site, Type, Facility, arrow. Each row is a `Link` to `/sites/<id>`. No `Edit`.
5. `src/pages/FacilitiesPage.tsx` (new): the home page as designed, loading `listFacilityIndex`. It owns the add, edit and delete facility dialogs and `Export CSV` (moved from today's Sites page as is).
6. `src/pages/SitesPage.tsx` becomes `src/pages/FacilityPage.tsx` (`git mv`, then edit): the facility page as designed. Loader: for `unassigned`, `listSiteSummaries(null)` and `listFacilities()` in parallel. Otherwise `getFacility` first; if it returns null, the loader returns null (the page shows `Facility not found.`); if not, `listSiteSummaries(id)` and `listFacilities()` (for the site dialog) in parallel. It keeps today's add, edit and delete site dialogs and adds `Edit facility` with `Delete facility`. `Export CSV` moves to the home page.
7. `src/App.tsx`: routes `/` → `FacilitiesPage`, `/facilities/:facilityId` → `FacilityPage`. `/sites/:siteId` and the checklist route are unchanged.
8. `src/pages/SiteDetailPage.tsx`: the loader also fetches `listFacilities()` (for the dialog and the back button). Back button, not-found and error links, and the after-delete navigation as designed. The site dialog uses `siteFields(facilities)`.
9. `src/pages/ChecklistPage.tsx`: the back-link text only.

Build, then commit: `Facilities: home page, facility page, sites in facilities`.

## Part D: CSV, RLS check, sample data and docs
1. `src/lib/csv.ts`: `Facility` becomes the first header and the first cell of every row.
2. `scripts/rls-check.ts`: add these checks to what is there, so a passing run prints 17 PASS lines:
   - `anon select on facilities succeeds`
   - `anon insert on facilities is rejected`
   - `editor insert on facilities succeeds` (name `rls-check <timestamp>`)
   - `editor delete of a facility with a site is rejected`: the editor sets the test site's `facility_id` to the test facility, then deleting the facility must return an error (code `23503`) and leave it in place.
   - `editor delete of an empty facility succeeds`: after the test site is deleted.

   The `finally` block also deletes a leftover test facility, after the leftover test site.
3. `supabase/seed.sql` (development data): add one facility `North Field` with a fixed id in the file's id style, and put Alpha Yard and Bravo Pad in it with an `update ... where facility_id is null`. Keep it safe to run twice. Update the header's contents line.
4. `supabase/example_site.sql`: add a facility `Example Facility` (fixed id, `on conflict do nothing`) and put Example Site in it with an `update ... where facility_id is null`, so re-running the file never pulls Example Site out of a facility someone already put it in. It now needs migrations 0001 to 0005; update that line and the removal instructions (delete the site first, then the facility, and only if it has no other sites).
5. `README.md`:
   - "Behavior to know about": a **Facilities** bullet (home page lists facilities with site counts; a facility lists its sites, sorted by name; every site belongs to one facility; sites from before facilities existed show under "No facility" until moved; a facility with sites cannot be deleted). Rewrite the search bullet for both search boxes. Add a short **Export CSV** bullet: it is on the home page, exports every reading, and its first column is Facility.
   - The "Deleting a site" bullet: a site can be edited or deleted from its facility's list or from its own page.
   - Folder layout: `0004_checklist_respiratory_name.sql` is already listed; add `0005_facilities.sql`, the two new pages, and the new components. Update the `pages/` line.
   - npm scripts: the RLS check now prints 17 PASS lines and also covers facilities (anon can read but not write them; a facility with a site cannot be deleted). Update the sentence about what the script inserts and deletes.
6. `DEPLOY.md`:
   - After step 2.5c, add 2.5d: the same steps with `supabase/migrations/0005_facilities.sql`.
   - Step 2.6: nine tables, adding `facilities`. Update the "eight tables" mention in the problems table too.
   - Step 5.9 and the first bullet of step 8 describe the old home page ("Site index", "Sites", "No sites yet."). Change them to the new one: `Facility index`, `Facilities`, `No facilities yet.`
   - Step 8: before adding `Test Yard`, tap **+ Add facility**, enter `Test Facility`, save, and open it; then add `Test Yard` there. The viewer check opens Test Facility, then Test Yard. At the end, delete Test Yard from the facility page, go back, delete Test Facility (Edit, Delete facility, confirm), and the home page says `No facilities yet.`
   - Read the rest of DEPLOY.md for any other step that describes the old Sites home page, and fix it the same way.

Build, then commit: `Facilities: CSV column, RLS check and docs`.

## Rules that are easy to break
- Every query stays in `src/lib/db.ts`. Components and pages never import `supabase`.
- Read-only mode means no edit controls in the DOM. Logged out, the home page, a facility page and the `No facility` page have no element with exact text `+ Add facility`, `+ Add site`, `Edit`, `Edit facility`, `Delete facility`, `Delete site` or `Save`. `← Back to facilities`, `Export CSV` and the search boxes are allowed.
- URLs of site and checklist pages do not change. Old links and bookmarks must keep working.
- Do not change the site page beyond the back button, its navigation and the dialog's facility field. Do not change `ConfirmDialog.tsx`, `mapLink.ts` or anything under the checklist feature except the one link text.
- No hex or rgb color literals in `src/`. Tap targets at least 44px tall.
- `npm run build` has zero TypeScript errors (`noUnusedLocals` is on).
- Do not apply SQL to any database. Do not run `supabase/seed.sql` or `supabase/example_site.sql`. Do not deploy, do not push, and do not touch `.env` or `.env.local`. You may read the project ref out of `VITE_SUPABASE_URL` in `.env` to build a link; print nothing else from that file.

## Verification
The dev server uses the dev database in `.env` (`rise-safety-dev`): Alpha Yard and Bravo Pad, possibly a site named `test`. None of them has a facility yet. `.env.local` shows the Verdun brand; leave it. Use names starting with `Phase 11` for everything you create, so the clean-up is easy.

**Stop point (the only one).** After Part D's commit:
1. Start the dev server with `preview_start` (`dev`).
2. Ask Will to do three things, then end your turn:
   1. Paste `supabase/migrations/0005_facilities.sql` into the dev project's SQL editor (`https://supabase.com/dashboard/project/<ref>/sql/new`, ref from `.env`) and run it.
   2. Run `npm.cmd run rls-check` in his own terminal with the password steps from the README, and paste the output.
   3. Log in as editor in the Browser pane.

When he replies, record pass or fail for each step:

1. The RLS output shows 17 PASS lines.
2. Logged in, home page: no facilities yet, and the `No facility` row shows the dev sites' count. Screenshot at 390px and 1280px.
3. `+ Add facility` `Phase 11 North`: toast `Facility added`, the row says `0 sites`. Add `Phase 11 South`. Add ` phase 11 north ` (lower case, with spaces): the duplicate error toast shows and the dialog stays open. Cancel.
4. Open `No facility`: the title, subtitle and sites show; there is no `+ Add site` and no `Edit facility`. `Edit` Alpha Yard: the Facility dropdown is second and blank. Save without choosing: `Facility is required.` Choose `Phase 11 North`, Save: toast `Site saved`, and Alpha Yard leaves this list.
5. Home: `Phase 11 North` says `1 site`. Open it: the banner says `1 site`, and Alpha Yard shows its last reading and entry count exactly as the old Sites page did. `+ Add site`: the Facility dropdown is preset to `Phase 11 North`. Add `Phase 11 site`: the list and banner say 2. Screenshot at 390px.
6. On this facility page, search `bravo`: `No sites match “bravo”.` (Bravo Pad is not in this facility.) Clear it.
7. Open Alpha Yard. The banner's first button is `← Back to Phase 11 North` and goes there. On Alpha Yard, `Edit site` shows the Facility dropdown preset to `Phase 11 North`; Cancel.
8. Home, search `alpha`: the Facilities block says no match, and the Sites block lists Alpha Yard with Facility `Phase 11 North`; clicking it opens the site page. Search `north`: Phase 11 North is listed. Search `well pad`: Bravo Pad is listed by its type, with Facility `No facility`. Clear the search: the facilities table is back.
9. `Edit` Phase 11 North, `Delete facility`: the error toast says it still has 2 sites, and the dialog stays open. Cancel. `Edit` Phase 11 South, `Delete facility`, then Cancel on the confirmation (nothing deleted), then again and confirm: toast `Facility deleted`, and it is gone.
10. Open Phase 11 North, `Edit facility`, rename it `Phase 11 North Renamed`: toast `Facility saved`, and the banner shows the new name without a reload.
11. `Export CSV`: the file's first column is `Facility`, and Alpha Yard's rows say `Phase 11 North Renamed`.
12. Open `/facilities/not-a-real-id`: `← Back to facilities` and `Facility not found.`
13. Log out. Run the DOM check from "Rules that are easy to break" on the home page, `Phase 11 North Renamed` and `No facility`. Screenshot the home page at 390px.
14. `npm.cmd run build` again: zero errors.

Clean-up: you cannot run SQL. Put this in your report for Will to paste into the dev SQL editor:
```sql
delete from public.sites where name = 'Phase 11 site';
update public.sites set facility_id = null where facility_id in (select id from public.facilities where name like 'Phase 11%');
delete from public.facilities where name like 'Phase 11%';
```

## When done
Stop and report:
- each verification step, pass or fail, with the screenshots;
- the final `npm run build` output;
- the clean-up SQL;
- the order for going live: (1) Will runs `0005_facilities.sql` in Verdun's Supabase SQL editor, (2) Will runs the separate facility load SQL for Verdun's existing sites, (3) Will pushes `main`, (4) check the home page on the live site: 12 facilities, and no `No facility` row unless a site was left out of the list (Example Site, if Verdun has it, counts: put it in a facility or delete it);
- anything left undone, and any place this prompt was ambiguous and what you chose.
