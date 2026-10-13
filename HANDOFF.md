# Handoff: start Phase 2

Spec: `../RISE_SAFETY_TRACKER_PROMPT.md` (read it in full, follow it exactly). Work in this folder.

## Phase 1 status: complete and verified
- `npm run build`: zero TypeScript errors. Tailwind pinned at 3.4.17.
- Migration `supabase/migrations/0001_init.sql` is applied to the Rise Safety Supabase project
  (ref `plpuagvohnepvdeuqvhu`, under will@vogelocity.com). Tables are empty.
- `npm run rls-check` passes 7/7 (needs `EDITOR_PASSWORD` set in the shell; the password is in a comment in
  `../rise-safety-tracker.env`, and must never go in `.env` or the frontend).
- Editor user `editor@rise-safety.example.com` exists. "Allow new users to sign up" is off (Will confirmed).

## Things to know
- The Supabase MCP connector in Claude cannot see this project (it only sees two other projects).
  Do not apply SQL to those. Give Will SQL to paste into this project's SQL editor instead:
  https://supabase.com/dashboard/project/plpuagvohnepvdeuqvhu/sql/new
- Existing files: `src/lib/{brand,supabase,db}.ts`, `src/components/{Header,Footer}.tsx`, placeholder
  `SitesPage.tsx` and `SiteDetailPage.tsx`. `db.ts` has the types and the `fetchAll()` paging helper.
  `auth.ts` does not exist yet (Phase 3).
- The project is inside OneDrive, and OneDrive is syncing `node_modules`, which slows it down. Pause sync or move the project.
- Nobody has read `../Ohm Site Tracker.txt`. The spec does not mention it.

## Phase 2 (from spec section 10)
Sites page and site detail page with real data, history table, CSV export, and no edit controls in
the page's HTML when the user is logged out. Needs `supabase/seed.sql` (2 sites, a few equipment, 3 sessions).
Before coding, state in one paragraph how you will verify. After coding, screenshot both pages at 390px
and 1280px, inspect the logged-out page HTML for the banned strings listed in the spec, and export the
CSV and check it. Then stop and report. Do not buy a domain or spend money without asking.
