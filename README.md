# Rise Safety: Site Equipment Readings Tracker

A phone-first website where a Rise Safety technician logs equipment readings (for example ohm readings on grounding equipment) at oil sites, and the client company views those readings read-only.

One deployment serves one client. Each client has its own Supabase project (database and login), its own Vercel project (hosting), and its own logo and colors, chosen at build time.

- **Viewers** open the URL and see everything. They never log in and no edit controls exist on their page.
- **Editors** tap "Editor login", enter the shared editor password, and can add sites, equipment and reading types, and log readings.

To put a new client online, follow [DEPLOY.md](DEPLOY.md).

## Stack

Vite, React, TypeScript, Tailwind CSS 3.4 (pinned), react-router-dom, Supabase (Postgres, Auth, Row Level Security), Vercel.

## Run it locally

You need Node.js 20 or newer and a Supabase project that already has every file in `supabase/migrations/` applied, in order (see DEPLOY.md, steps 1 to 3).

1. Install the packages: `npm install`
2. Copy `.env.example` to `.env` and fill in the four values (table below).
3. Start the dev server: `npm run dev`
4. Open the address it prints (normally http://localhost:5173).

On Windows PowerShell, `npm` can be blocked by the execution policy. Use `npm.cmd` instead, for example `npm.cmd run dev`.

## Environment variables

Vite only exposes variables that start with `VITE_`. They are read at build time and end up in the built JavaScript, so none of them may be secret.

| Variable | What it is |
|---|---|
| `VITE_CLIENT` | Folder name under `clients/` to build for, for example `example`. |
| `VITE_SUPABASE_URL` | The Supabase project URL, `https://<ref>.supabase.co`. |
| `VITE_SUPABASE_ANON_KEY` | The Supabase publishable key (`sb_publishable_...`) or the legacy `anon` key. Public by design; Row Level Security is the protection. |
| `VITE_EDITOR_EMAIL` | The email of the shared editor user in Supabase Auth, for example `editor@acme.example.com`. The login modal asks only for the password. |

Never put the `service_role` / secret key anywhere in this project. Never put the editor password in `.env`, source files or documents.

## npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Starts the Vite dev server with hot reload. |
| `npm run build` | Type-checks (`tsc --noEmit`) and builds the site into `dist/`. Must finish with zero TypeScript errors. |
| `npm run preview` | Serves the built `dist/` locally, to check a production build. |
| `npm run rls-check` | Checks Row Level Security from the outside: anon can read, anon cannot write or start a checklist, the editor can write and start one. Needs the editor password in the `EDITOR_PASSWORD` environment variable for that one command. |
| `npm run pdf-sample -- <file.pdf>` | Writes a sample checklist PDF (built by the same code as the app's `Download PDF`) to the given path, to check the layout without a browser or database. |

Running the RLS check in PowerShell (the password prompt hides what you type):

```powershell
$p = Read-Host -AsSecureString "Editor password"
$env:EDITOR_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($p))
npm.cmd run rls-check
Remove-Item Env:EDITOR_PASSWORD
```

The script inserts one test site, gives it a test entry and checklist, and deletes the site again (which removes the rest). A passing run prints 12 PASS lines.

## Folder layout

```
rise-safety-tracker/
  README.md                  this file
  DEPLOY.md                  step-by-step: deploy a new client
  .env.example               the four env vars, no real values
  vercel.json                rewrites every path to index.html so /sites/<id> survives a refresh
  clients/
    example/brand.json       placeholder brand (name, title, colors, footer text)
    example/logo.svg         placeholder logo
    <slug>/                  one folder per real client (brand.json + logo.png or logo.svg)
  supabase/
    migrations/0001_init.sql tables, Row Level Security policies and grants
    migrations/0002_site_map_url.sql  adds sites.map_url
    migrations/0003_checklists.sql    site checklist tables and the start_checklist function
    seed.sql                 demo data for development only
  scripts/rls-check.ts       the RLS check behind npm run rls-check
  scripts/checklist-pdf-sample.ts  the sample PDF behind npm run pdf-sample
  src/
    lib/supabase.ts          Supabase client from the env vars
    lib/brand.ts             loads brand.json and the logo for VITE_CLIENT, sets the CSS color variables
    lib/auth.ts              login, logout and the session hook
    lib/db.ts                every database query; components never call Supabase directly
    lib/checklistDefaults.ts the standard Rise Safety site checklist (a site's first checklist starts from it)
    lib/checklist.ts         checklist helpers: grouping and numbering, progress, the page path, the PDF file name
    lib/checklistPdf.ts      builds a checklist's PDF with jsPDF (loaded only when someone exports)
    pages/                   SitesPage (/), SiteDetailPage (/sites/:siteId) and ChecklistPage (/sites/:siteId/entries/:sessionId/checklist)
    components/              Header, SitesTable, EntriesTable, EntryView, EntryPanel, ReadingsSheet, PageBanner, EquipmentList, LogReadingsForm, HistoryTable, ChecklistItemDialog, RemoveChecklistDialog, Toast, ...
```

## Branding

`clients/<slug>/brand.json` holds `companyName`, `appTitle`, `logoFile`, four `colors` (`primary`, `accent`, `background`, `text`) and `footerText`. The logo file sits next to it, as `logo.png` or `logo.svg`. Colors reach the page as CSS variables and Tailwind tokens, so there are no color literals in `src/`. The footer text ("Maintained by Rise Safety") is the only place Rise Safety appears.

## Behavior to know about

- **Readings are text.** Technicians enter things like `<1`, `0.3`, `N/A` and `OL`. The app never parses a value as a number and only rejects an empty one.
- **One session per site per date.** The database enforces `unique (site_id, reading_date)`.
- **Logging onto a date that already has a session** asks "Readings already exist for this date. Update them?" and, if confirmed, merges the typed values into that session. Inputs left blank on this path are ignored: they never delete an existing reading.
- **Each site page lists entries (one per dated visit) newest first.** The Compare tab shows the same readings side by side across dates. Editing or deleting an entry happens from inside the entry.
- **Editing an entry** opens the form prefilled. There, an input that had a value and is now cleared deletes that reading.
- **Checklists.** Each entry can have one site checklist, on its own page; saving a new entry opens it, and ticks and values save as soon as they are made. A site's first checklist starts from the standard Rise Safety list, and each later one starts from that site's own list, which an editor changes by adding or removing items and sections with "also for future checklists" ticked (the default). Past checklists never change, because each keeps its own copy of its items. If a site's list is ever emptied completely, its next checklist starts again from the standard list. Viewers see checklists read-only, and anyone can download one as a PDF (or share it, on phones).
- **Deleting a site** deletes all its equipment, reading types, sessions, readings and checklists. The confirmation says so. A site can be edited or deleted from the Sites list or from its own page (`Edit site`).
- **The Sites page has a search box** that filters by site name or type as you type. It is not remembered between visits.
- **Each site can have a map link.** Paste a map link or bare GPS coordinates (`31.5521, -97.1467`, which become a Google Maps link) in the site dialog; the site page then shows an "Open map" button. Only http and https links are accepted, in the app and in the database.
- **Dates** are stored as ISO `date` and shown as "Sep 12, 2026", built from the string parts. "Today" comes from the device's local date.
- **The technician name** is remembered in the browser's `localStorage`. This is the only thing the app stores there.

## Known limits

- **Reading inputs use `inputMode="text"`, not `"decimal"` as the spec says.** This is deliberate. The iOS decimal keypad has no `<` key and no letter keys, so `<1`, `OL` and `N/A` could not be typed on an iPhone.
- **One shared editor login, no per-person accounts.** Anyone with the editor password can edit everything, and nothing records who changed what. The "Technician" field on a session is free text.
- **The Supabase dashboard cannot set a user's password directly.** To change the editor password, delete the editor user and create it again with the same email and the new password (DEPLOY.md, step 7.3). The "Send password recovery" button does not help, because the editor email is not a real inbox.
- **No password reset, magic links, charts, offline mode, photo uploads or alerts.** These are out of scope on purpose.
- **The checklist PDF only covers Western European characters.** It uses jsPDF's built-in Helvetica, which has no Greek, Cyrillic, Asian or emoji characters. The ohm sign is printed as `ohm`; other unusual characters may print wrongly.
- **`supabase/seed.sql` is for the development project only.** Never run it against a client's database.
