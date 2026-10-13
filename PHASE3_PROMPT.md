Read HANDOFF.md and ../RISE_SAFETY_TRACKER_PROMPT.md in full and follow them exactly. Work in this folder.

Phases 1 and 2 are done and verified. Phase 3 (editor mode) is next. Do not start Phase 4.

## Before writing any code
In one paragraph, tell me how you will verify Phase 3, as the spec requires. Then start.

## Phase 3 (spec sections 5, 7 and 10)
Build editor mode on top of the existing read-only pages:

- `src/lib/auth.ts`: login, logout, and a `useSession` hook. Email comes from `VITE_EDITOR_EMAIL`; the user types only the password. The session persists across refresh (Supabase handles this).
- `LoginModal`: password only. A wrong password shows an error toast with the actual error message, and the app stays read-only.
- Header: replace the current inert "Editor login" button. Logged out: "Editor login". Logged in: "Editing · Log out".
- Edit controls are **not rendered at all** when logged out (not hidden with CSS). Logged out, the page must still contain no element with exact text "+ Add site", "+ Add equipment", "+ Add reading type", "Edit", "Delete" or "Log readings".
- Sites page, edit mode: "+ Add site" (name, site type, notes); per card "Edit" (rename, change type, delete). Delete confirms and says it deletes all equipment and readings for that site.
- Site detail, edit mode: "+ Add equipment"; per equipment rename, delete, "+ Add reading type" (name and unit); per reading type rename and delete; "Copy reading types from…" which copies another piece of equipment's reading types onto this one.
- "Log readings" opens a full-screen form: date defaults to today (built from local `getFullYear/getMonth/getDate`, there is already `todayLocalIso()` in `src/lib/dates.ts`), technician (remembered in localStorage, the only acceptable use of it), and one input per reading type grouped under its equipment. Save writes one `reading_session` plus its `readings` as an upsert on `(session_id, reading_type_id)`. An empty input creates no row. On an edit, an input that was filled before and is now empty deletes that row. If a session already exists for that site and date, ask "Readings already exist for this date. Update them?" and update in place. Toast "Readings saved".
- Tapping a date column header in the history table offers "Edit this session" (reopens the form prefilled) or "Delete this session" (confirm).
- Every write shows a success toast, and an error toast with the real error message on failure. Never fail silently.
- Components named in the spec: `ConfirmDialog`, `LoginModal`, `LogReadingsForm` (a `Toast` provider and `useToast` already exist).

## Rules that are easy to break
- Every query lives in `src/lib/db.ts`. Components never call supabase directly. Add the write functions there.
- `value` is text. Never parse it as a number. "<1", "OL" and "N/A" are valid. Validate only "not empty".
- Never build dates with `new Date("YYYY-MM-DD")` or `toISOString().slice(0, 10)`.
- Phone first: 390px wide, tap targets at least 44px, `inputMode="decimal"` on reading inputs, no hover-only controls.
- No color literals in `src/`. Use the Tailwind tokens (`primary`, `accent`, `background`, `text`, `danger`, `success`, `muted`).
- Do not build anything not in the spec. No per-person accounts, roles, magic links, password reset, charts, or offline mode.
- Never use or ask for the `service_role` / secret key.

## Verification (spec section 10, Phase 3)
Run this script against the dev Supabase project and report each step pass or fail:

1. Log in.
2. Add site "Test Yard".
3. Add equipment "Light Plant 1" with reading type "Ohms (Ω)".
4. Add "Light Plant 2" and copy types from Light Plant 1.
5. Log readings for today with values "0.4" and "<1".
6. Refresh the page. History shows both.
7. Log readings for the same date again and change a value. Confirm the update path fires (the "Update them?" prompt, and one session row, not two).
8. Delete the session.
9. Delete the site.
10. Log out. Confirm read-only again (the banned-string check passes).
11. Try a wrong password. Error toast, still read-only.

Also: run `npm run build` (zero TypeScript errors) and `npm run rls-check` (7 of 7), and screenshot the logged-in Sites page, site detail page and Log readings form at 390px.

## Credentials and test data
- The dev project is ref `plpuagvohnepvdeuqvhu`. The editor email is in `.env` (`VITE_EDITOR_EMAIL`). The password is in a comment in `../rise-safety-tracker.env`. Do not copy it into `.env`, source files, docs or chat.
- If you cannot type the password into the login modal yourself, ask me to log in once in the Browser pane, then continue the script. `npm run rls-check` needs `EDITOR_PASSWORD` set in the shell for that command only.
- The database holds seed data: Alpha Yard and Bravo Pad (ids `a1000000-...-0001` and `-0002`). Do not edit or delete them. Create "Test Yard" for the script and delete it at the end, so the database is back to the 2 seed sites, 3 sessions and 12 readings.
- The Supabase connector in Claude can see this project and can be used to check row counts (read-only queries).
- Do not buy a domain or spend money.

## Known facts
- Existing files: `src/lib/{brand,supabase,db,dates,csv,useLoad}.ts`, `src/components/{Header,Footer,Toast,SiteCard,EquipmentList,HistoryTable,Skeleton}.tsx`, `src/pages/{SitesPage,SiteDetailPage}.tsx`. `db.ts` has the read queries and the `fetchAll()` paging helper (Supabase caps responses at 1000 rows).
- Cascade deletes are set in the migration, so deleting a site removes everything under it.
- The Phase 2 "Show all" toggle (more than 10 sessions) was not exercised because the seed has at most 2 sessions per site. If it is cheap to do during Phase 3 testing, check it and then clean up.
- The project folder is in OneDrive, which slows `node_modules`. Pause sync or move the project if builds are slow.

When done, stop and report: each verification step's result, anything you left undone, and any place the spec was ambiguous and what you chose.
