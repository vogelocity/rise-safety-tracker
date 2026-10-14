Read `README.md` and `../RISE_SAFETY_TRACKER_PROMPT.md` in full. Work in this folder.

Phases 1 to 4 are done, verified and deployed. Phase 5 changes how the app looks and how its pages are organized. It does not change the database, the access rules, the CSV export or what the app can do. This is the only phase; do not start anything else.

## Before writing any code
In one paragraph, tell me how you will verify this phase. Then start.

## Why this phase exists
The mockup `../Site_Ohm_Readings_Tracker-2.html` has the look Will wants: navy top bar, gold accents, condensed uppercase headings, white table cards with a navy header row, a header banner with a short gold bar, pill badges, and a readings sheet with one row per item. Open it once in the Browser pane to see it, then set it aside. Do not copy its code or its architecture: it is a desktop-first, localStorage, single-file app, and spec section 2 lists its problems.

The current React app already has the right structure (sites list → site page → log form) but reads like a generic admin page: cards instead of a table, plain headings, the equipment section on top of the site page, and a side-by-side history table that does not look like a list of visits. Will wants:

1. Front page = a table of **sites**. Never one row per visit.
2. Site page = that site's **entries** (one row per dated visit), newest first, with a button to add a new entry. Equipment setup moves out of the way.
3. Opening an entry = a sheet with one row per item and the reading next to it, like the mockup's detail view.

This prompt replaces the *layout* in spec sections 7.2 and 7.3. Every *behavior* rule in the spec still applies (read-only mode, toasts, confirmations, dates, text values, phone first). If this prompt conflicts with a behavior rule in the spec, the spec wins. If it conflicts with the spec's layout, this prompt wins. If something is ambiguous, ask.

## Vocabulary (use these words in the UI)
- **Site**: a location. **Entry**: one `reading_session`, a dated visit. **Reading**: one value. **Equipment** and **reading type**: unchanged.
- The code keeps the names `ReadingSession`, `listSessions`, `saveSession`, `deleteSession`. Only user-facing text changes.

## Visual language (the mockup translated into the existing tokens)
Brand colors come from `brand.json` through the Tailwind tokens `primary` (navy in the example client), `accent` (gold), `background`, `text`, plus the fixed tokens `danger`, `success`, `muted`. Tailwind's own `white`, `black` and `gray-*` utilities are already used in `src/` and are fine. Hex or rgb literals in `src/` are not.

`primary`, `accent`, `background` and `text` are CSS variables, so opacity modifiers like `bg-primary/10` do **not** work on them. Use `bg-white/10`, `border-white/20`, `bg-success/10` (the fixed tokens accept modifiers) or a gradient overlay instead.

| In the mockup | Build it as |
|---|---|
| Barlow body text, Barlow Condensed headings | Google Fonts (step 1). `font-sans` = Barlow, `font-display` = Barlow Condensed. Headings, eyebrow labels, table header labels and badges use `font-display`. |
| Navy top bar | Header stays `bg-primary text-background`, sticky. App title: `font-display text-lg font-bold uppercase tracking-wider`. Login button: `rounded-lg border border-white/35 px-3 text-sm font-semibold`. |
| Header banner with gold bar | `PageBanner` component (step 3): `rounded-xl bg-primary bg-gradient-to-br from-transparent to-white/15 px-5 py-6 text-background`. Gold bar: `mb-3 h-[3px] w-12 rounded bg-accent`. Eyebrow: `font-display text-xs font-semibold uppercase tracking-[0.15em] opacity-60`. Title: `font-display text-3xl font-bold uppercase tracking-wide`. |
| Pill badges on the banner | `rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium`. Gold variant adds `border-accent text-accent`. |
| White table card | `overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm`. Header row: `bg-primary px-4 py-3 text-background font-display text-xs font-semibold uppercase tracking-[0.1em]`, first header label `text-accent`. Body rows: `border-b border-gray-200 last:border-b-0`, alternating `odd:bg-white even:bg-gray-50`. |
| Gold button (`btn-gold`) | `primaryButtonClass` becomes `bg-accent text-primary` (step 2). Used for every main action. |
| Outline button on navy (`btn-outline`) | New `outlineOnDarkButtonClass` (step 2). |
| Green "has value" input | An input with a non-blank value adds `border-success bg-success/10`. |
| "View →" | The plain character `→` in `text-sm font-semibold text-primary`. No icon library. |
| Section label ("ALL SITES — NEWEST FIRST") | `font-display text-xs font-semibold uppercase tracking-[0.15em] text-muted`. |

Phone first still applies: build at 390px first, every tap target at least 44px tall, no hover-only controls. Nothing scrolls sideways on a phone except the Compare table, which already does.

## Work, file by file
Run `npm run build` after each step. It must finish with zero TypeScript errors every time, not only at the end.

### 1. Fonts
`index.html`, inside `<head>`, before the `<title>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
```
`tailwind.config.js`, inside `theme.extend`, next to `colors`:
```js
fontFamily: {
  sans: ['Barlow', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  display: ['"Barlow Condensed"', 'Barlow', 'ui-sans-serif', 'system-ui', 'sans-serif'],
},
```
`src/index.css` needs no change: Tailwind's preflight applies `font-sans` to the page.

### 2. `src/components/Modal.tsx` (styles only)
Replace the five exported class strings with these. Nothing else in the file changes except the `<h2>`, which gets `font-display text-xl uppercase tracking-wide text-primary` in place of `text-lg`.
```ts
export const inputClass =
  'min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-text focus:border-accent focus:outline-none'
export const primaryButtonClass =
  'min-h-[44px] rounded-lg bg-accent px-4 text-sm font-semibold text-primary hover:brightness-95 disabled:opacity-60'
export const secondaryButtonClass =
  'min-h-[44px] rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-text disabled:opacity-60'
export const dangerButtonClass =
  'min-h-[44px] rounded-lg bg-danger px-4 text-sm font-semibold text-white disabled:opacity-60'
export const outlineOnDarkButtonClass =
  'min-h-[44px] rounded-lg border border-white/35 bg-transparent px-4 text-sm font-semibold text-background disabled:opacity-60'
```

### 3. `src/components/PageBanner.tsx` (new)
```ts
interface Props {
  eyebrow: string          // small label above the title, e.g. "Site index"
  title: string
  subtitle?: string        // text-sm opacity-70, rendered under the title when present
  badges?: ReactNode       // rendered in a `mt-3 flex flex-wrap gap-2` row when present
  action?: ReactNode       // buttons; right of the text on sm: and up, under it on phones
}
```
Outer: the banner classes from the table, with `flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between`. Left column: gold bar, eyebrow, title, subtitle, badges. Right column: `action`, as `flex flex-wrap gap-2 sm:shrink-0`.

### 4. `src/components/Header.tsx`
Restyle only. Keep the logo (or company name) link, the app title, and the "Editor login" / "Editing · Log out" button. Apply the classes from the table. Drop the `opacity-90` and `text-sm` on the app title. Keep the "nothing renders until the stored session has been read" behavior and the `LoginModal`.

### 5. `src/lib/db.ts` (one addition)
Add a session count to the site summary so the sites table can show it. Nothing else in this file changes.
```ts
export interface SiteSummary extends Site {
  equipment_count: number
  session_count: number
  last_reading_date: string | null
}
```
In `listSiteSummaries`, next to the `latest` map:
```ts
const sessionCounts = new Map<string, number>()
for (const s of sessions) sessionCounts.set(s.site_id, (sessionCounts.get(s.site_id) ?? 0) + 1)
```
and in the returned objects add `session_count: sessionCounts.get(s.id) ?? 0`.

### 6. `src/components/SitesTable.tsx` (new; delete `SiteCard.tsx`)
```ts
interface Props {
  sites: SiteSummary[]
  /** Edit mode only. When absent, no Edit control is rendered at all. */
  onEdit?: (site: SiteSummary) => void
}
```
Not a `<table>`: each row must be a link and, in edit mode, also hold a button, and a `<button>` inside an `<a>` is invalid HTML. Build it as:
- One white table card.
- Header row, `hidden sm:flex`: a `flex-1 grid grid-cols-[1fr_1fr_1fr_auto_44px] gap-3` with the labels **Site**, **Type**, **Last reading**, **Entries** and an empty fifth cell. When `onEdit` is present, add an empty `w-[72px]` spacer after the grid so the header lines up with the rows.
- `<ul>`. Each `<li>` is `flex items-stretch`: a `<Link to={`/sites/${site.id}`} className="block min-h-[56px] flex-1 px-4 py-3">` and, when `onEdit` is present, a separate `<button type="button" className="min-h-[44px] w-[72px] text-sm underline">Edit</button>`.
- Inside the Link, two layouts toggled with `hidden sm:grid` / `sm:hidden`:
  - `sm:` and up: the same `grid grid-cols-[1fr_1fr_1fr_auto_44px] gap-3 items-center`. Cells: name (`font-semibold`), type (`text-sm text-muted`, or `—` when null), `formatDate(last_reading_date)` or `No readings yet`, `${n} ${n === 1 ? 'entry' : 'entries'}`, and `→` right-aligned.
  - Phones: line 1 is `flex items-baseline justify-between gap-2` with the name (`font-semibold`), the type (`text-sm text-muted`) and `→`. Line 2 (`mt-1 text-sm text-muted`): `Last reading: Sep 12, 2026 · 2 entries`, or `No readings yet · 0 entries`.
- Empty state (zero sites): `No sites yet.` in `px-4 py-6 text-muted` inside the card.

### 7. `src/pages/SitesPage.tsx`
- Replace the `<h1>` row with `<PageBanner eyebrow="Site index" title="Sites" subtitle="Select a site to see its entries" action={...} />`. The `action` slot holds `Export CSV` (`outlineOnDarkButtonClass`, visible to everyone, same handler) and, in edit mode only, `+ Add site` (`primaryButtonClass`).
- Under the banner: a `mt-6 mb-3` section label `All sites`, then `<SitesTable sites={state.data} onEdit={isEditor ? (site) => setDialog({ kind: 'edit', site }) : undefined} />`.
- Loading state: one `SkeletonBlock` shaped like the banner (`h-40`) and one like the card (`h-48`). Error state unchanged. The add / edit / delete dialogs and `run()` are unchanged.

### 8. `src/components/ReadingsSheet.tsx` (new)
The mockup's readings card, shared by the edit form and the read-only view.
```ts
interface Props {
  /** Only equipment that has reading types. The caller filters. */
  equipment: EquipmentWithTypes[]
  renderValue: (type: ReadingType, equipment: EquipmentWithTypes) => ReactNode
}
```
One white table card containing a real `<table className="w-full">`: header row **Item** | **Reading** (the "Item" label in `text-accent`). For each piece of equipment: a group row (`<th colSpan={2} scope="colgroup">`, `bg-gray-50 px-4 py-2 text-left font-display text-sm font-semibold uppercase tracking-wide`) with the equipment name, then one row per reading type: left cell `readingTypeLabel(type.name, type.unit)` (`px-4 py-2 font-semibold text-primary`), right cell `renderValue(type, equipment)` (`w-[45%] px-4 py-2 sm:w-[220px]`). Rows have `border-b border-gray-200` and a minimum height of 44px. Import `readingTypeLabel` from `./EquipmentList` as the other components do.

### 9. `src/components/EntryPanel.tsx` (new)
The full-screen shell, shared by the form and the read-only view. It replaces the shell that is currently inline at the top of `LogReadingsForm`.
```ts
interface Props {
  title: string              // "New entry", "Edit entry" or "Entry"
  siteName: string
  closeLabel: string         // "← Cancel" or "← Back"
  onClose: () => void
  primaryAction?: ReactNode  // the Save button; edit mode only
  children: ReactNode
}
```
Outer: `fixed inset-0 z-30 flex flex-col bg-background text-text`, `role="dialog" aria-modal="true" aria-label={title}`. Top bar: `bg-primary text-background`, inner `mx-auto flex min-h-[56px] w-full max-w-[900px] items-center gap-3 px-4`; left: the close button (`min-h-[44px] text-sm underline`); middle: `min-w-0 flex-1 truncate text-center font-display font-semibold uppercase tracking-wide` showing `${title} · ${siteName}`; right: `primaryAction` when present. Body: `flex-1 overflow-y-auto`, inner `mx-auto w-full max-w-[900px] space-y-6 px-4 py-6`. Pressing Escape calls `onClose` (copy the `keydown` effect from `Modal.tsx`).

### 10. `src/components/EntryView.tsx` (new, read-only)
```ts
interface Props {
  siteName: string
  equipment: EquipmentWithTypes[]
  session: ReadingSession
  readings: Reading[]   // all readings for the site; filter by session.id here
  onClose: () => void
}
```
Renders `<EntryPanel title="Entry" closeLabel="← Back" ...>` with no `primaryAction`. Body: a `grid gap-3 sm:grid-cols-2` block with **Date** (`formatDate(session.reading_date)`) and **Technician** (value or `—`), each as a small label over a value; then `session.notes` when present (`whitespace-pre-wrap`); then `<ReadingsSheet>` whose `renderValue` returns the stored value as `font-semibold` text, or `<span className="text-muted">–</span>` when that type has no reading in this session. **No inputs and no buttons other than Back.** This is the only panel a logged-out viewer can open.

### 11. `src/components/LogReadingsForm.tsx`
Keep every behavior: today as the default date, the remembered technician, blank inputs create nothing, the `findSession` check and the "Readings already exist for this date. Update them?" prompt, `deleteCleared: editing`, toast "Readings saved", `inputMode="text"` with its comment. Change only the following:
- Use `<EntryPanel>` for the shell. `title={editing ? 'Edit entry' : 'New entry'}`, `closeLabel="← Cancel"`, `primaryAction` = the Save button.
- Replace the per-equipment `<section>` list with `<ReadingsSheet equipment={groups} renderValue={...} />` where `renderValue` returns the same `<input>` as today. Add `aria-label={readingTypeLabel(type.name, type.unit)}` to each input, because the label is now a table cell rather than a `<label htmlFor>`. When `values[type.id]?.trim()` is non-blank, add `border-success bg-success/10` to the input.
- Keep the Date / Technician block above the sheet and the Cancel / Save row below it.
- New optional prop `onDelete?: () => Promise<void>`. The page passes it only when editing an existing entry. When present, render a `Delete entry` button (`dangerButtonClass`) at the left of the bottom row (`flex items-center justify-between`). Tapping it sets a `confirmDelete` state that renders a `<ConfirmDialog title="Delete entry?" message={`Delete the ${formatDate(date)} entry? This deletes every reading in it. This cannot be undone.`} confirmLabel="Delete entry" danger busy={saving} />`. On confirm: `setSaving(true)`, `await onDelete()`, toast `Entry deleted`, `onSaved()`, `onClose()`. On error: toast the real message, `setSaving(false)`, close the confirm, stay on the form. `ConfirmDialog` is `z-40` and the panel is `z-30`, so it layers correctly.
- The empty-equipment text stays: `Add a reading type to a piece of equipment before logging readings.`

### 12. `src/components/EntriesTable.tsx` (new)
```ts
interface Props {
  sessions: ReadingSession[]   // newest first, as listSessions returns them
  readings: Reading[]
  equipment: EquipmentWithTypes[]
  onOpen: (session: ReadingSession) => void
}
```
- Progress per entry: `const typeIds = new Set(equipment.flatMap((e) => e.reading_types.map((t) => t.id)))`; `total = typeIds.size`; per session `filled = readings.filter((r) => r.session_id === s.id && typeIds.has(r.reading_type_id)).length`.
- Badge: `total > 0 && filled === total` → `✓ Complete` in `text-xs font-semibold text-success`; otherwise `${filled}/${total} readings` in `text-xs text-muted`; when `total === 0`, `${filled} readings`.
- Same card approach as `SitesTable`. Header (`hidden sm:grid grid-cols-[1fr_1fr_auto_44px] gap-3`): **Date**, **Technician**, **Readings**, empty. Each row is a `<li>` containing one `<button type="button" onClick={() => onOpen(s)} className="block min-h-[56px] w-full px-4 py-3 text-left">`. Use `<span className="block">` elements inside the button, never `<div>` (a button may only contain phrasing content).
  - `sm:` and up: grid cells `formatDate(s.reading_date)` (`font-display text-base font-semibold text-primary`), technician or `—` (`text-sm text-muted`), the badge, `→`.
  - Phones: line 1 `flex items-baseline justify-between gap-2` with the date, the badge and `→`; line 2 the technician (`mt-1 text-sm text-muted`).
- Show the newest `DEFAULT_SESSION_COUNT` (import it from `HistoryTable`) by default, with the same `Show all (N)` / `Show latest 10` toggle button `HistoryTable` uses.
- Empty state: `No entries yet.` in `px-4 py-6 text-muted` inside the card.

### 13. `src/components/HistoryTable.tsx`
Restyle only; the data logic is unchanged. Head row `bg-primary text-background font-display text-xs font-semibold uppercase tracking-[0.1em]`; the sticky first header cell becomes `bg-primary text-accent` instead of `bg-white`. Group rows keep `bg-gray-50`. Remove the `onSessionTap` prop and its `<button>` branch entirely: date headers are plain text now, because editing and deleting an entry happen from the Entries tab.

### 14. `src/components/EquipmentList.tsx`
Restyle only: each equipment card `rounded-xl border border-gray-200 bg-white p-4 shadow-sm`, the name in `font-display text-lg font-semibold uppercase tracking-wide`. The chips, the edit-mode buttons, their labels and their sizes stay as they are.

### 15. `src/pages/SiteDetailPage.tsx`
- Remove the plain `← Sites` link. The banner's `action` slot holds a `<Link to="/" className={outlineOnDarkButtonClass + ' inline-flex items-center'}>← Back to sites</Link>`.
- `<PageBanner eyebrow="Site" title={site.name} subtitle={site.notes ?? undefined} badges={...} action={...} />`. Badges, in this order: the site type in the gold variant when present; `${sessions.length} ${sessions.length === 1 ? 'entry' : 'entries'}`; `Last reading: ${formatDate(sessions[0].reading_date)}` when there is at least one session.
- Tabs: `const [tab, setTab] = useState<'entries' | 'compare' | 'equipment'>('entries')`. Under the banner, a `mt-6 flex gap-2 border-b border-gray-200` row with `role="tablist"` and three `<button type="button" role="tab" aria-selected={tab === ...}>` of `min-h-[44px] px-3 font-display text-sm font-semibold uppercase tracking-wide`; the selected one `border-b-2 border-accent text-primary`, the others `text-muted`. Labels: **Entries**, **Compare**, **Equipment**. The tab is not in the URL. Tabs render for viewers too; they are navigation, not edit controls.
- **Entries** tab: a `mt-4 mb-3 flex items-center justify-between` row with the section label `Entries` and, in edit mode only, `+ New entry` (`primaryButtonClass`) → `setDialog({ kind: 'log', session: null })`. Then `<EntriesTable sessions={data.sessions} readings={data.readings} equipment={data.equipment} onOpen={(session) => setDialog(isEditor ? { kind: 'log', session } : { kind: 'view', session })} />`. If the site has no reading types at all and the user is an editor, show `Add equipment and reading types first (Equipment tab).` in `text-muted` above the table.
- **Compare** tab: section label `Compare across dates`, then `<HistoryTable equipment={data.equipment} sessions={data.sessions} readings={data.readings} />`.
- **Equipment** tab: the current Equipment section moved here unchanged: the heading row with `+ Add equipment` in edit mode, and `<EquipmentList>` with the same `actions`.
- `Dialog` union: remove `sessionMenu` and `deleteSession`; add `{ kind: 'view'; session: ReadingSession }`. Render `view` as `<EntryView siteName={data.site.name} equipment={data.equipment} session={dialog.session} readings={data.readings} onClose={() => setDialog(null)} />`, and it is the **only** dialog kind rendered outside the `editing && ...` guard. The `log` dialog gains `onDelete={dialog.session ? () => deleteSession(dialog.session.id) : undefined}` (use a local `const session = dialog.session` so TypeScript narrows it). Remove the now-unused imports (`Modal`, `secondaryButtonClass`, `dangerButtonClass` if nothing else uses them).
- `loadSiteDetail` already fetches readings for every session (both branches of the `needed` expression cover all of them), so the badges and `EntryView` have what they need. Do not change it.

### 16. `src/App.tsx`
No route changes. Keep `max-w-[900px] px-4 py-6`.

### 17. Docs
- `README.md` folder layout: replace `SiteCard` with `SitesTable, EntriesTable, EntryView, EntryPanel, ReadingsSheet, PageBanner`. Add to "Behavior to know about": *Each site page lists entries (one per dated visit) newest first. The Compare tab shows the same readings side by side across dates. Editing or deleting an entry happens from inside the entry.*
- Do not edit `../RISE_SAFETY_TRACKER_PROMPT.md`.

## Rules that are easy to break
- Read-only mode means edit controls **do not exist in the DOM**, not hidden with CSS. Logged out, the page must contain no element with exact text `+ Add site`, `+ Add equipment`, `+ Add reading type`, `Edit`, `Delete`, `Log readings`, `+ New entry`, `Delete entry` or `Save`, and no `<input>` anywhere until the login modal is opened. `EntryView` is the only panel a viewer can open.
- Every query stays in `src/lib/db.ts`. The only change there is `session_count`. Do not add or change write functions, RLS, migrations or `csv.ts`.
- `value` is text. Never parse it. Keep `inputMode="text"` (README "Known limits" explains why).
- Dates only through `formatDate` and `todayLocalIso` in `src/lib/dates.ts`.
- No hex or rgb color literals in `src/`. Brand tokens cannot take `/opacity` modifiers (see Visual language).
- No new npm dependencies. No icon packs; use the `→` and `←` characters.
- Phone first: 390px, 44px tap targets, no hover-only controls, nothing scrolls sideways except the Compare table.
- `npm run build` must finish with zero TypeScript errors after every step. On Will's PowerShell, `npm` is blocked; use `npm.cmd`.
- Do not run `supabase/seed.sql` anywhere. Do not deploy. Do not push. Do not touch `.env`.
- In the Bash tool here, long heredocs fail. Use the Write and Edit tools to create and change files.

## Verification
`.env` already points at the dev database (Supabase project `rise-safety-dev`, ref `prvvmnjlkqjejykkklrx`). It holds the seed data: Alpha Yard (4 equipment, 5 reading types, entries on Sep 12, 2026 and Aug 14, 2026) and Bravo Pad (2 equipment, 3 reading types, one entry on Sep 12, 2026). It also backs the demo at rs-deploy-test.vercel.app, so leave it exactly as you found it. Do not edit or delete the seed rows. If the Sites page shows no sites, stop and ask Will.

Start the dev server with the Browser pane's `preview_start` using the `dev` configuration in `.claude/launch.json`. Then:

1. `npm run build`: zero TypeScript errors.
2. Logged out, at 390px and at 1280px, screenshot: the Sites page; Alpha Yard with the Entries tab; the Sep 12, 2026 Alpha Yard entry opened in `EntryView`; the Compare tab; the Equipment tab. Expected badges: Alpha Yard Sep 12 `4/5 readings`, Alpha Yard Aug 14 `✓ Complete`, Bravo Pad Sep 12 `✓ Complete`. Expected sites table: Alpha Yard `2 entries`, Bravo Pad `1 entry`.
3. Logged out, banned-string check over the DOM (`read_page` or `javascript_tool`): none of the strings listed under "Rules that are easy to break" exist, the only button in the header is `Editor login`, and there is no `<input>`. Repeat with the entry view open.
4. Log in. If you cannot type the password yourself, ask Will to log in once in the Browser pane. Screenshot at 390px: the Sites page, Alpha Yard (Entries tab), and the `+ New entry` form.
5. Script, each step pass or fail:
   1. Open Bravo Pad → `+ New entry` → keep today's date → technician `Test` → Wellhead Ohms `0.7`, Separator Ohms `<1`, Separator Pressure blank → Save. Toast `Readings saved`. The Entries tab shows a new top row for today with `2/3 readings`.
   2. Tap that row. The form opens prefilled with `0.7` and `<1`, both inputs green, the date shown as text. Enter Pressure `130` → Save. The row now shows `✓ Complete`.
   3. `+ New entry` again, keep today's date, enter Wellhead Ohms `0.9` only → Save → the `Readings already exist for this date. Update them?` prompt appears → Update. Still one row for today; opening it shows `0.9`, `<1`, `130`.
   4. Compare tab: today's column is leftmost with those three values.
   5. Open today's entry → `Delete entry` → the confirm names today's date → confirm. Toast `Entry deleted`. Bravo Pad is back to one entry, Sep 12, 2026.
   6. Equipment tab: `+ Add equipment` `Temp` → it appears → Rename to `Temp 2` → Delete → confirm → gone. This proves the moved section still works.
   7. Sites page: Bravo Pad shows `1 entry` and `Last reading: Sep 12, 2026`. `Export CSV` downloads a file with a header row and 12 data rows.
   8. Log out → repeat step 3.
   9. Wrong password → error toast with Supabase's message, still read-only.
6. Confirm the database is back to 2 sites, 6 equipment, 3 sessions, 12 readings. The Supabase connector in Claude can run read-only counts on `rise-safety-dev`.
7. Commit everything with the message `Phase 5: layout redesign (sites table, entries tab, entry sheet)`. Do not push.

## When done
Stop and report: each verification step pass or fail with the screenshots, the final `npm run build` output, anything left undone, and any place where this prompt or the mockup was ambiguous and what you chose.
