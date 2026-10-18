Read `README.md` in full. Work in this folder. Phases 1 to 9 are done and committed on `main`; run `git log --oneline -8` and confirm the Phase 9 commit (`Site page: Edit site button (edit or delete from the site itself)`) is in the list before you start. The app is live for a real client (Verdun Oil Company). This phase adds the site checklist and nothing else.

## If this is a restart
This phase commits after each part (commit messages are given below). If `git log` already shows some of them, a previous session got partway. Skip the committed parts, run `npm.cmd run build` to confirm the tree is clean, and continue with the next part. Do not redo committed work.

## Rules for this session (the last one stalled; these prevent it)
- **Do not open `../Rise Safety Site Checklist.pdf`.** Every item from it is written out in Part B. You need nothing else from that file.
- **Never run `npm run dev`, `vite` or `npm run preview` in Bash or PowerShell.** They never exit and the session hangs. Start the dev server only with the Browser pane's `preview_start` using the `dev` configuration in `.claude/launch.json`.
- `npm install` can be slow because this folder is in OneDrive. Run it with `run_in_background` or a 5-minute timeout, never in a loop. On PowerShell use `npm.cmd`.
- Create and change files with the Write and Edit tools. Long heredocs in the Bash tool fail.
- When you need Will (paste SQL, type the password, run the RLS check), ask once with exact steps, then end your turn. Do not poll or retry while you wait.
- If a tool or command fails twice the same way, stop and report what failed. Do not invent workarounds (installing tools, switching shells, rewriting the approach).
- Commit after each part, with the message given. Do not push: pushing deploys straight to Verdun's live site, and the database change has to reach Verdun's project first.

## Before writing any code
In one paragraph, tell me how you will verify this phase. Then start.

## How it works (the design)
- **One checklist per entry.** An entry is a `reading_session` (one per site per date). Its checklist lives on its own page, `/sites/:siteId/entries/:sessionId/checklist`. Nothing is added to the readings form, the Entries list or the Compare tab beyond a link.
- **Filling one in.** After a technician saves a **new** entry (`+ New entry`), the app opens that entry's checklist page. When an editor opens the page and the entry has no checklist yet, it is created on the spot from the site's list. Ticking a box or leaving a text field saves straight away (no Save button), because technicians are on a phone at a site.
- **Each site has its own list.** The first checklist at a site starts from the standard Rise Safety list (Part B). After that, each new checklist at that site starts from the site's own list. An editor can add an item or section, or remove an item or section, on any checklist. The dialog has a checkbox, **ticked by default**, that also applies the change to that site's future checklists. Example: a site with no SCBAs removes "Respiratory Protection" once and never sees it again. Past checklists never change, because each checklist keeps its own copy of its items.
- **Items are a checkbox or a written value.** Checkbox items match the paper form. Value items are the PSI lines ("Unit 1: ____ PSI") and the "Additional" lines. Values are text, like readings, so "2200", "N/A" or "~2100" all work.
- **Location, Date and Inspector** on the paper form come from the entry: the site name, the entry date and the entry's technician.
- **Deficiencies / Corrective Actions** is one free-text box at the bottom of every checklist, numbered after the last section.
- **Verdun sees everything read-only,** like readings. Logged out, the checklist page shows ticks and values with no inputs and no edit buttons. Logged-out viewers reach it from the read-only entry view (`View checklist →`).
- **PDF.** Everyone, logged in or not, gets `Download PDF`, which builds a letter-size PDF of that one checklist in the browser. To print it, open the file and print. Where the browser can share files (phones), a `Share` button hands the PDF to Mail, Messages and so on, which is the easy way to email it.

## Part A: database migration
Create `supabase/migrations/0003_checklists.sql` with exactly this content:

```sql
-- Site checklists: each site has its own checklist template; each entry (reading_session) can have one
-- checklist, which keeps its own copy of the items so later template changes never rewrite history.
-- Run once per client, in the Supabase SQL editor of that client's project, after 0001 and 0002.

create table public.site_checklist_items (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.sites on delete cascade,
  section     text not null,
  group_name  text,
  label       text not null,
  kind        text not null default 'check' check (kind in ('check', 'value')),
  unit        text,
  sort_order  int not null default 0,
  created_at  timestamptz default now()
);

create table public.checklists (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null unique references public.reading_sessions on delete cascade,
  deficiencies  text,
  created_at    timestamptz default now()
);

create table public.checklist_items (
  id                uuid primary key default gen_random_uuid(),
  checklist_id      uuid not null references public.checklists on delete cascade,
  template_item_id  uuid references public.site_checklist_items on delete set null,
  section           text not null,
  group_name        text,
  label             text not null,
  kind              text not null default 'check' check (kind in ('check', 'value')),
  unit              text,
  checked           boolean not null default false,
  value             text,
  sort_order        int not null default 0,
  created_at        timestamptz default now()
);

-- checklists.session_id is already indexed by its unique constraint.
create index site_checklist_items_site_id_idx       on public.site_checklist_items (site_id);
create index checklist_items_checklist_id_idx       on public.checklist_items (checklist_id);
create index checklist_items_template_item_id_idx   on public.checklist_items (template_item_id);

alter table public.site_checklist_items  enable row level security;
alter table public.checklists            enable row level security;
alter table public.checklist_items       enable row level security;

create policy "site_checklist_items_select"  on public.site_checklist_items for select to anon, authenticated using (true);
create policy "site_checklist_items_insert"  on public.site_checklist_items for insert to authenticated with check (true);
create policy "site_checklist_items_update"  on public.site_checklist_items for update to authenticated using (true) with check (true);
create policy "site_checklist_items_delete"  on public.site_checklist_items for delete to authenticated using (true);

create policy "checklists_select"  on public.checklists for select to anon, authenticated using (true);
create policy "checklists_insert"  on public.checklists for insert to authenticated with check (true);
create policy "checklists_update"  on public.checklists for update to authenticated using (true) with check (true);
create policy "checklists_delete"  on public.checklists for delete to authenticated using (true);

create policy "checklist_items_select"  on public.checklist_items for select to anon, authenticated using (true);
create policy "checklist_items_insert"  on public.checklist_items for insert to authenticated with check (true);
create policy "checklist_items_update"  on public.checklist_items for update to authenticated using (true) with check (true);
create policy "checklist_items_delete"  on public.checklist_items for delete to authenticated using (true);

-- 0001's "grant ... on all tables" only covered the tables that existed then.
grant select on public.site_checklist_items, public.checklists, public.checklist_items to anon, authenticated;
grant insert, update, delete on public.site_checklist_items, public.checklists, public.checklist_items to authenticated;

-- Creates the checklist for an entry in one transaction and returns its id. Safe to call twice: an
-- existing checklist is returned unchanged. A site with no template (or an emptied one) is first given
-- p_defaults, the standard list sent by the app as a JSON array of
-- {section, group, label, kind, unit}. Security invoker, so RLS applies as for any other write.
create or replace function public.start_checklist(p_session_id uuid, p_defaults jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_site_id uuid;
  v_checklist_id uuid;
begin
  select site_id into v_site_id from reading_sessions where id = p_session_id;
  if v_site_id is null then
    raise exception 'Entry not found.';
  end if;

  -- Serializes checklist starts per site, so two editors cannot seed the template twice.
  perform 1 from sites where id = v_site_id for update;

  select id into v_checklist_id from checklists where session_id = p_session_id;
  if v_checklist_id is not null then
    return v_checklist_id;
  end if;

  if not exists (select 1 from site_checklist_items where site_id = v_site_id) then
    insert into site_checklist_items (site_id, section, group_name, label, kind, unit, sort_order)
    select v_site_id,
           e.item->>'section',
           nullif(e.item->>'group', ''),
           e.item->>'label',
           e.item->>'kind',
           nullif(e.item->>'unit', ''),
           (e.ord - 1)::int
    from jsonb_array_elements(p_defaults) with ordinality as e(item, ord);
  end if;

  insert into checklists (session_id) values (p_session_id) returning id into v_checklist_id;

  insert into checklist_items (checklist_id, template_item_id, section, group_name, label, kind, unit, sort_order)
  select v_checklist_id, t.id, t.section, t.group_name, t.label, t.kind, t.unit, t.sort_order
  from site_checklist_items t
  where t.site_id = v_site_id;

  return v_checklist_id;
end;
$$;

revoke execute on function public.start_checklist(uuid, jsonb) from public, anon;
grant execute on function public.start_checklist(uuid, jsonb) to authenticated;
```

Do not apply it anywhere. Will pastes it into the dev project at the stop point in "Verification".

## Part B: data layer

### B1. `src/lib/checklistDefaults.ts` (new)
The standard list, typed exactly as below, in this order. The check-item text is copied character for character from the paper form.

```ts
/** One item of the standard Rise Safety site checklist. Sent to start_checklist as JSON. */
export interface DefaultChecklistItem {
  section: string
  group: string | null
  label: string
  kind: 'check' | 'value'
  unit: string | null
}

function checks(section: string, group: string | null, labels: string[]): DefaultChecklistItem[] {
  return labels.map((label) => ({ section, group, label, kind: 'check', unit: null }))
}

function values(section: string, group: string, items: [label: string, unit: string | null][]): DefaultChecklistItem[] {
  return items.map(([label, unit]) => ({ section, group, label, kind: 'value', unit }))
}

const GAS = 'Gas Detection System'
const SAFETY = 'Safety Equipment'
const RESPIRATORY = 'Respiratory Protection'
const CASCADE = 'Cascade System'

/**
 * The standard list from "Rise Safety Site Checklist.pdf" (October 2026). A site's first checklist
 * starts from this; after that the site's own list is used. Deficiencies / Corrective Actions is not an
 * item: it is the checklist's free-text field, always shown last.
 */
export const CHECKLIST_DEFAULTS: DefaultChecklistItem[] = [
  ...checks(GAS, 'Sensor Batteries', [
    'Check all sensor battery levels',
    'Replace low batteries as needed',
    'Confirm proper installation and secure battery covers',
  ]),
  ...checks(GAS, 'Battery Packs (Visual Inspection)', [
    'No corrosion on terminals',
    'No swelling or physical damage',
    'Wiring secure and intact',
    'No loose connections',
  ]),
  ...checks(GAS, 'Main Monitor', [
    'Monitor powered on',
    'No fault codes present',
    'Display functioning properly',
    'Alarms (audible/visual) operational',
  ]),
  ...checks(GAS, 'Monitor Battery Condition', [
    'Battery charge level acceptable',
    'Charging system functioning',
    'No battery damage or overheating',
  ]),
  ...checks(SAFETY, 'Windsock', [
    'Properly mounted',
    'No tears or excessive wear',
    'Rotates freely with wind',
    'Clearly visible',
  ]),
  ...checks(RESPIRATORY, 'SCBAs', [
    'Units present at designated locations',
    'Cylinders full (record PSI below)',
    'No physical damage',
    'Straps, harness, and facepieces in good condition',
    'PASS device operational',
    'Expiration dates checked',
  ]),
  ...values(RESPIRATORY, 'Cylinder PSI Readings', [
    ['Unit 1', 'PSI'],
    ['Unit 2', 'PSI'],
    ['Unit 3', 'PSI'],
    ['Additional', null],
  ]),
  ...checks(CASCADE, null, [
    'Cascade bottles present',
    'Bottles properly secured',
    'No visible damage or corrosion',
    'Valves operational',
    'Hoses and fittings intact',
  ]),
  ...values(CASCADE, 'Bottle PSI Readings', [
    ['Bottle 1', 'PSI'],
    ['Bottle 2', 'PSI'],
    ['Bottle 3', 'PSI'],
    ['Additional', null],
  ]),
]
```
That is 4 sections, 29 checkbox items and 8 value items (37 items).

### B2. `src/lib/db.ts` (every new query goes here)
Types:
```ts
export type ChecklistItemKind = 'check' | 'value'

export interface ChecklistItem {
  id: string
  checklist_id: string
  template_item_id: string | null
  section: string
  group_name: string | null
  label: string
  kind: ChecklistItemKind
  unit: string | null
  checked: boolean
  value: string | null
  sort_order: number
  created_at: string
}

export interface Checklist {
  id: string
  session_id: string
  deficiencies: string | null
  created_at: string
}

export interface ChecklistWithItems extends Checklist {
  items: ChecklistItem[] // sorted by sort_order
}
```

Read queries:
- `getSession(sessionId)`: one `ReadingSession` or null; returns null for ids that fail `UUID_RE`, like `getSite`.
- `getChecklist(sessionId)`: the checklist row (`maybeSingle`) or null, then its items with `fetchAll` (not an embedded select), sorted by `sort_order`.

Write queries (follow the existing patterns: `requireName`, `blankToNull`, `normalizeUnit`, `expectRows`):
- `startChecklist(sessionId)`: `supabase.rpc('start_checklist', { p_session_id: sessionId, p_defaults: CHECKLIST_DEFAULTS })`, returns the id. Import `CHECKLIST_DEFAULTS` from `./checklistDefaults`.
- `setChecklistItemChecked(id, checked)`, `setChecklistItemValue(id, value)` (blank stores null), `setChecklistDeficiencies(checklistId, text)` (blank stores null). Each uses `.select('id')` and `expectRows`.
- `addChecklistItem(input)` with `{ checklistId, siteId, section, group, label, kind, unit, alsoForSite }`. `section` and `label` go through `requireName` (`'Section'`, `'Item'`), `group` through `blankToNull`, `unit` through `normalizeUnit` for value items and null for checkbox items. The new item's `sort_order` is the checklist's highest plus 1: extend `nextSortOrder`'s table and scope unions with `'checklist_items' | 'site_checklist_items'` and `'checklist_id' | 'site_id'`. When `alsoForSite` is true, insert the `site_checklist_items` row first (its own next sort order within the site), then the checklist item with `template_item_id` set to it. If the second insert fails, delete the template row, then throw, the same way `saveSession` cleans up.
- `removeChecklistItem(item, alsoForSite)`: delete the checklist item (`expectRows`). Then, if `alsoForSite` and `item.template_item_id`, delete that template row. Zero rows there is fine (it may already be gone).
- `removeChecklistSection(checklistId, siteId, section, alsoForSite)`: delete this checklist's items in that section (`expectRows`). Then, if `alsoForSite`, delete every `site_checklist_items` row for that site with that section. Zero rows is fine.

### B3. `src/lib/checklist.ts` (new, pure helpers, no imports from React or Supabase)
- `checklistPath(siteId, sessionId)` returns `/sites/${siteId}/entries/${sessionId}/checklist`.
- `groupChecklist(items)` returns `{ name, number, groups: { name: string | null, items }[] }[]`. Sort the items by `sort_order`. Sections are ordered by their first item, groups within a section by their first item, items within a group by `sort_order`. `number` runs 1, 2, 3 and so on. This rule is why a new item can simply take the highest `sort_order` plus 1: it still shows at the end of its own group.
- `checklistProgress(items)` returns `{ checked, total }` over checkbox items only.
- `DEFICIENCIES_TITLE = 'Deficiencies / Corrective Actions'`.
- `checklistFileName(siteName, isoDate)` returns `Checklist - <site> - <YYYY-MM-DD>.pdf`, with `\ / : * ? " < > |` in the site name replaced by `-`.
- `sameName(a, b)` compares trimmed, case-insensitive. Use it so a typed group or section that matches an existing one reuses the existing spelling.

Build (`npm.cmd run build`, zero errors), then commit: `Checklist: database migration 0003 and data layer`.

## Part C: the checklist page

### C1. Route
In `App.tsx` add `<Route path="/sites/:siteId/entries/:sessionId/checklist" element={<ChecklistPage />} />`.

### C2. `src/pages/ChecklistPage.tsx` (new)
**Loading.** With `useLoad`, keyed on `siteId`, `sessionId` and `isEditor`: load the site and the session. If either is missing, or `session.site_id !== siteId`, show `← Back to sites` and `Entry not found.`, the same way SiteDetailPage shows `Site not found.`. Load the checklist. If there is none and the user is an editor, call `startChecklist` and load it again. Use the same skeleton and `LoadError` as SiteDetailPage.

**Banner** (`PageBanner`): eyebrow `Checklist`, title = site name. Badges: the entry date (`formatDate`), `Inspector: <technician>` when there is one, and progress `<checked> of <total> checked`. Actions, in this order: `← Back to site` (a `Link` to `/sites/:siteId`), then `Download PDF` and `Share` (Part E) when a checklist exists. Use `outlineOnDarkButtonClass`.

**No checklist, logged out:** below the banner, `No checklist was filled in for this entry.` and no PDF buttons.

**Sections.** Use `groupChecklist`. Each section is a card headed `<number>. <section name>`. Each group with a name gets a small subheading. Then comes the final card, `<last number + 1>. Deficiencies / Corrective Actions`.

**Editor view.**
- Checkbox item: the whole row is a `<label>` with a native checkbox and the text, at least 44px tall. Ticking saves at once. Update local state first; if the write fails, undo the tick and show the error toast.
- Value item: the label, a text input (`inputClass`, `inputMode="text"`, `autoComplete="off"`), and the unit after it when there is one. Save on blur, and on Enter, only when the text changed.
- Deficiencies: a textarea (4 rows) that saves on blur when changed.
- No success toasts for these saves. Under the banner, a small status line (`aria-live="polite"`) reads `Saving…` while any write is in flight and `All changes saved` after. Errors use the existing error toast. A failed value or deficiencies save keeps the typed text, so the next blur retries.
- Keep the items in local state, seeded from the loaded data. Reseed after `reload()`, which follows each add or remove below. Do not reload after a tick or a value save.
- Each item has a remove button on the right: `×`, 44px square, `aria-label="Remove <label>"`. Each section header has `+ Add item` and `Remove section`. After the last section comes `+ Add section`.

**Logged-out view.** No `input`, `textarea` or `select` elements and no edit buttons. A checkbox item shows a ✓ or an empty box (`aria-label` `Checked` or `Not checked`) and the text. A value item shows `Unit 1: 2200 PSI`, or `Unit 1: –` when empty. Deficiencies shows the text with `whitespace-pre-wrap`, or `None recorded.`

### C3. Dialogs (new components; do not change `FieldsDialog`, `ConfirmDialog` or `Modal`)
Build them on `Modal` with the existing `inputClass` and button classes.

`src/components/ChecklistItemDialog.tsx`, one component with two modes:
- **Add item** (from a section): title `Add item to <section>`. Fields:
  - `Item` (required, placeholder `For example: Gauge reads zero at rest`).
  - `Group` (optional, placeholder `Optional, for example: Main Monitor`, with a `<datalist>` of that section's group names).
  - `Type`: two radio buttons, `Checkbox` (default) and `Written value`.
  - `Unit` (shown only for `Written value`, placeholder `Optional, for example: PSI`).
  - A checkbox, ticked by default: `Also add to future checklists at <site>`.
  - Buttons: `Cancel` and `Add item`. Success toast: `Item added`.
- **Add section:** title `Add section`. Fields: `Section` (required), then the same fields as above for the section's first item. Buttons: `Cancel` and `Add section`. Success toast: `Section added`. If the name matches an existing section (`sameName`), show the error toast `That section already exists. Use + Add item in it.` and keep the dialog open.
- When the typed group matches an existing group in that section (`sameName`), store the existing spelling.

`src/components/RemoveChecklistDialog.tsx`:
- **Item:** title `Remove item?`, message `Remove "<label>" from this checklist?`. The checkbox `Also remove it from future checklists at <site>`, ticked by default, shows only when the item has a `template_item_id`. Buttons: `Cancel` and `Remove item` (danger). Toast: `Item removed`.
- **Section:** title `Remove section?`, message `Remove "<section>" and its <n> items from this checklist?` (use `item` when n is 1). The same checkbox, ticked by default, is always shown. Buttons: `Cancel` and `Remove section` (danger). Toast: `Section removed`.

All four writes go through a `run()` helper like SiteDetailPage's: toast the result, close the dialog, `reload()`.

## Part D: links from entries (the only changes to existing screens)
1. `EntryView.tsx` (the read-only entry a logged-out viewer opens): under the date/technician block, add a `Link` labeled `View checklist →` to `checklistPath(session.site_id, session.id)`, styled with `secondaryButtonClass` plus `inline-flex items-center`.
2. `LogReadingsForm.tsx`:
   - In `write()`, keep the result of `saveSession`. When the form was opened with `session === null` (`+ New entry`, including the "Update readings?" merge path), call `onSaved()`, then `onClose()`, then `navigate(checklistPath(siteId, result.sessionId))`. Editing an existing entry closes as today.
   - In edit mode only, add an `Open checklist →` button (`secondaryButtonClass`) directly above the readings. If the technician or any reading differs from what the form opened with, first show `ConfirmDialog`: title `Leave without saving?`, message `Your changes to this entry are not saved.`, confirm `Leave`. Otherwise, or after `Leave`, call `onClose()` and navigate to the checklist.
   - Entry delete message: `Delete the ${formatDate(date)} entry? This deletes every reading in it and its checklist. This cannot be undone.`
3. The site delete message, in **both** `SitesPage.tsx` and `SiteDetailPage.tsx`, must stay character-for-character identical: `Delete "${name}"? This deletes all equipment, readings and checklists for that site. This cannot be undone.`

Build, then commit: `Checklist page: fill in per entry, add or remove items, links from entries`.

## Part E: PDF download and share
1. `npm.cmd install jspdf@^3` (run it in the background or with a 5-minute timeout). Note the installed version for the report.
2. `src/lib/checklistPdf.ts` (new): `export async function buildChecklistPdf(input: ChecklistPdfInput): Promise<Blob>`. Load jsPDF inside the function with `const { jsPDF } = await import('jspdf')`, so the library is downloaded only when someone exports. The input is plain data, with nothing from the DOM, so the same function also runs in Node for the sample script:
   ```ts
   export interface ChecklistPdfInput {
     companyName: string
     footerText: string
     logo: { dataUrl: string; width: number; height: number } | null
     siteName: string
     date: string // ISO
     technician: string | null
     sections: ReturnType<typeof groupChecklist>
     deficiencies: string | null
     generatedOn: string // ISO, today's local date
   }
   ```
   Layout: letter portrait in points (`new jsPDF({ unit: 'pt', format: 'letter' })`), 48pt margins, Helvetica.
   - Header: the logo top-left, scaled to fit 160×40pt with its aspect kept, when given. On the right, `FACILITY INSPECTION CHECKLIST` in bold 15pt with the company name under it in 9pt. Then a thin rule.
   - Info block: `Location: <site>`, `Date: <formatDate(date)>`, `Inspector: <technician>` (a blank line `__________` when there is none), and `Checked: <n> of <total> items`.
   - Sections: `<number>. <section>` bold 12pt, group subheadings bold 10pt, items 10pt. Each checkbox item gets a 9pt square drawn with `rect`. When it is ticked, draw the check mark as two `line` strokes. Do not use a ✓ character: the built-in fonts do not have it. Value items read `<label>: <value> <unit>`, or `<label>: ________ <unit>` when empty, so a printout can be written on. Wrap long text with `splitTextToSize`.
   - The last section: `<n + 1>. Deficiencies / Corrective Actions`, then the wrapped text, or 4 ruled blank lines when empty.
   - Page breaks: before drawing anything, start a new page if it would cross the bottom margin. Never leave a section or group heading alone at the bottom of a page; move it down with at least its first item.
   - Footer on every page, drawn after layout: `<footerText> · Generated <formatDate(generatedOn)> · Page i of n`, centered, 8pt, grey.
   - Use grayscale numbers (`setTextColor(90)`, `setDrawColor(150)`). This does not break the "no hex or rgb literals" rule, which is about CSS colors.
   - jsPDF's built-in fonts only cover Western European characters. Print `Ω` as `ohm`; other unusual characters are a known limit (put that in the README).
3. On `ChecklistPage`:
   - `Download PDF`: shows `Preparing…` and is disabled while building. It builds the PDF and downloads it as `checklistFileName(site, date)` through a temporary object URL and an `<a download>` (revoke the URL afterwards).
   - The logo: load `loadBrand().logoUrl` into an `Image`, draw it on a canvas, and pass `toDataURL('image/png')` with the natural size. If that fails, pass `null` and carry on without a logo. This works for both `logo.png` and `logo.svg`.
   - `Share`: shown only when `navigator.canShare?.({ files: [new File([''], 'x.pdf', { type: 'application/pdf' })] })` is true, checked once on mount. It builds the same PDF and calls `navigator.share({ files: [file], title: 'Checklist · <site> · <date>' })`. A user cancel (`AbortError`) is silent. Any other error shows the error toast.
   - Logged-out viewers get both buttons. The PDF is identical for viewers and editors.
4. `scripts/checklist-pdf-sample.ts` (new) and an npm script `"pdf-sample": "tsx scripts/checklist-pdf-sample.ts"`. It builds a sample from `CHECKLIST_DEFAULTS` (turned into items with `groupChecklist`), with:
   - the first 10 checkbox items ticked;
   - `Unit 1` set to `2200`;
   - one added item with a 200-character label;
   - a deficiencies text long enough to push onto a second page;
   - site `Sample Site`, date `2026-10-17`, technician `Sample Tech`, no logo.

   It writes the PDF to the path given as the first argument. If the dynamic import of `jspdf` does not work under Node, report it and skip the script. Do not try other PDF libraries.

Build. The build output must show jsPDF in its own chunk, not in the main `index-*.js`. A Vite chunk-size warning for the jsPDF chunk is acceptable. Then commit: `Checklist: PDF download and share`.

## Part F: RLS check and docs
1. `scripts/rls-check.ts`: add these checks, keeping the existing seven. Use the test site the script already creates, and do it all before that site is deleted, so the cascade cleans up.
   - `anon select on checklist_items succeeds`
   - `anon insert on site_checklist_items is rejected` (expect an error)
   - `anon start_checklist is rejected` (expect an error)
   - `editor start_checklist creates the standard checklist`: the editor inserts a `reading_sessions` row for the test site (today's date), calls the RPC with `CHECKLIST_DEFAULTS`, and the returned checklist has exactly `CHECKLIST_DEFAULTS.length` items.
   - `editor start_checklist again returns the same checklist`
   That makes 12 PASS lines.
2. `README.md`:
   - "Behavior to know about": add a **Checklists** bullet summarizing "How it works" above in 4 or 5 sentences, including that a site's list is restarted from the standard list if it is ever emptied completely.
   - Folder layout: add `0003_checklists.sql` and the new files.
   - npm scripts: add `pdf-sample`. Update the RLS check text to 12 PASS lines.
   - Known limits: the PDF's character set.
   - Change "Deleting a site deletes all its equipment, reading types, sessions and readings" to include checklists.
3. `DEPLOY.md`:
   - After step 2.5a, add 2.5b: the same steps with `supabase/migrations/0003_checklists.sql`.
   - Add a short section, **Updating a live client when a phase adds a migration**: run the new migration in that client's Supabase SQL editor first (expect "Success. No rows returned"), and only then push. Pushing deploys at once, and the new page fails until the tables exist.

Build, then commit: `Checklist: RLS check and docs`.

## Rules that are easy to break
- Every query stays in `src/lib/db.ts`. Components and pages never import `supabase`.
- Logged out, the checklist page has no `input`, `textarea` or `select` element and no element with exact text `+ Add item`, `+ Add section`, `Remove section`, `Remove item`, `Save`, `Edit` or `Delete`. `← Back to site`, `Download PDF`, `Share` and `View checklist →` are allowed.
- The readings form, Entries list and Compare tab get no checklist content, only the links in Part D.
- No hex or rgb color literals in `src/`. Tap targets at least 44px tall.
- `npm run build` has zero TypeScript errors (`noUnusedLocals` is on).
- Do not apply SQL to any database. Do not run `supabase/seed.sql` or `supabase/example_site.sql`. Do not deploy, do not push, and do not touch `.env` or `.env.local`. You may read the project ref out of `VITE_SUPABASE_URL` in `.env` to build a link; print nothing else from that file.

## Verification
The dev server uses the dev database in `.env` (`rise-safety-dev`): Alpha Yard (with a map link) and Bravo Pad, possibly a site named `test`. `.env.local` shows the Verdun brand; leave it.

**Stop point (the only one).** After Part F's commit:
1. Start the dev server with `preview_start` (`dev`).
2. Ask Will to do three things, then end your turn:
   1. Paste `supabase/migrations/0003_checklists.sql` into the dev project's SQL editor (`https://supabase.com/dashboard/project/<ref>/sql/new`, ref from `.env`) and run it.
   2. Run `npm.cmd run rls-check` in his own terminal with the password steps from the README, and paste the output.
   3. Log in as editor in the Browser pane.

When he replies, record pass or fail for each step:

1. The RLS output shows 12 PASS lines.
2. `npm.cmd run pdf-sample -- <scratchpad>\sample.pdf`. Then, with Poppler, run `pdftotext -layout` on it and `pdftoppm -png -r 60` to render the pages. Read the PNGs and check:
   - The title and the Location, Date and Inspector lines are there.
   - All 4 sections are numbered 1 to 4, with Deficiencies numbered 5.
   - The first 10 boxes show check marks.
   - `Unit 1: 2200 PSI` is there.
   - The long label wraps.
   - There are 2 pages, with `Page 1 of 2` and `Page 2 of 2`.

   If `pdftotext` is not on PATH yet, use `C:\Users\vogel\AppData\Local\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-25.07.0\Library\bin\`.
3. Logged in, on Bravo Pad, check that it has no entries on 2000-01-01 or 2000-01-02 (pick two other unused dates if it does, and use them below). Then `+ New entry` with date 2000-01-01 and one reading, and Save.
   - The toast says `Readings saved`.
   - The URL is `/sites/<id>/entries/<id>/checklist`.
   - The page has 4 sections, 29 checkboxes, 8 value inputs and the Deficiencies box.
   - The badge says `0 of 29 checked`.
   - Screenshot at 390px and 1280px.
4. Tick the 3 Sensor Batteries boxes. The badge says `3 of 29 checked` and the status says `All changes saved`. Reload the page: still 3.
5. Type `2200` in Unit 1, then tap elsewhere. Type `Phase 10 test` in Deficiencies, then tap elsewhere. Reload: both are still there.
6. Cascade System, `+ Add item`: `Phase 10 one-off`, Checkbox, with the future box **unticked**. It shows after `Hoses and fittings intact` and before `Bottle PSI Readings`.
7. `+ Add section`: `Phase 10 section`, first item `Phase 10 future item`, with the future box ticked. It is section 5, and Deficiencies becomes 6.
8. Remove Windsock's `Clearly visible` with the future box **unticked**. Remove the section `Respiratory Protection` with the future box ticked. Both are gone, the sections renumber (Cascade System becomes 3), 4 value inputs are left, and the badge says `3 of 24 checked`. The count is 29 + 2 added − 1 item − 6 Respiratory checkboxes.
9. `Download PDF`: a file downloads and the console shows no errors. Note whether `Share` shows.
10. Back on Bravo Pad, `+ New entry` on 2000-01-02. Its checklist:
    - has `Phase 10 section`;
    - has no Respiratory section;
    - still has `Clearly visible`;
    - has no `Phase 10 one-off`;
    - says `0 of 24 checked`, with 4 value inputs.

    Then open the 2000-01-01 checklist again: nothing on it changed (past checklists are copies).
11. Alpha Yard, `+ New entry` on 2000-01-01. Its checklist has the full standard list (29 and 8), so site lists are independent.
12. Open the Bravo 2000-01-01 entry from Entries (the editor form).
    - `Open checklist →` goes to the checklist.
    - Back on the form, change a reading, then click `Open checklist →`. `Leave without saving?` appears. Cancel keeps the form open; `Leave` navigates.
    - `Delete entry` shows the new message. Cancel.
13. Log out. Open the Bravo 2000-01-01 entry; the read-only view shows `View checklist →`. Open it.
    - The ticks, `2200 PSI` and the deficiencies text show.
    - The DOM check from "Rules that are easy to break" passes.
    - `Download PDF` works.
    - Screenshot at 390px.
14. Logged out, open a checklist URL for an entry that has no checklist (any older Alpha Yard entry). It says `No checklist was filled in for this entry.` and a logged-out visit does not create one.
15. `npm.cmd run build` again: zero errors.

Clean-up: you cannot run SQL. Put this in your report for Will to paste into the dev SQL editor (with the dates you actually used):
```sql
delete from public.reading_sessions where reading_date in ('2000-01-01', '2000-01-02');
delete from public.site_checklist_items where site_id in (select id from public.sites where name in ('Alpha Yard', 'Bravo Pad'));
```

## When done
Stop and report:
- each verification step, pass or fail, with the screenshots;
- the final `npm run build` output, the jsPDF version and its chunk size;
- the clean-up SQL;
- the order for going live: (1) Will runs `0003_checklists.sql` in Verdun's Supabase SQL editor, (2) Will pushes `main`, (3) check one checklist on the live site;
- anything left undone, and any place this prompt was ambiguous and what you chose.
