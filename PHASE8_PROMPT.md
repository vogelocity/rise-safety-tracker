Read `README.md` in full. Work in this folder. Phases 1 to 7 are done and committed on `main`; run `git log --oneline -5` and confirm the Phase 7 commit (`Sites page: search box filtering by name and type`) is in the list before you start. The app is live for a real client. This phase adds one feature and nothing else.

## Before writing any code
In one paragraph, tell me how you will verify this phase. Then start.

## The feature
Each site can store a map link. On the site's page, an **Open map** button opens that link in a new tab, which on a phone hands off to the maps app.

Technicians are given a map link for each site (usually a Google Maps share link like `https://maps.app.goo.gl/...`). When adding or editing a site, they paste it into a new **Map link** field. Sometimes they only have the GPS numbers, so the field also accepts bare coordinates like `31.5521, -97.1467` and turns them into a Google Maps link to that point.

**Behavior**
- The Add site and Edit site dialogs get a fourth field, **Map link**, under Notes. Optional. Placeholder `Paste a map link or GPS coordinates`.
- What is accepted, after trimming:
  - Blank: no link (stored as `null`).
  - Text containing an `http://` or `https://` link: the **first** such link is stored, without the text around it and without trailing `.,;:!?`. So `Bravo Pad: https://maps.app.goo.gl/AbC123.` stores `https://maps.app.goo.gl/AbC123`.
  - Bare coordinates, latitude first, separated by a comma and/or spaces, optionally in parentheses, latitude within ±90 and longitude within ±180: stored as `https://www.google.com/maps/search/?api=1&query=<lat>,<lng>` with the numbers exactly as typed.
  - Anything else (including `javascript:` links, links without `https://`, and degree-minute-second text like `31°33'07"N`): the save fails with the error toast `Map link must be a web link (starting with https://) or coordinates like 31.5521, -97.1467.` The dialog stays open with what was typed.
- Editing a site whose link came from coordinates shows the stored Google Maps URL in the field, not the original numbers. That is expected.
- On the site page (`SiteDetailPage`), when the site has a link, the banner shows an **Open map** button next to `← Back to sites`. It is a plain `<a>` with `target="_blank"` and `rel="noopener noreferrer"`. No link, no button.
- Shown to everyone, logged in or not. It is not an edit control.
- The Sites list page does not change. CSV export does not change.

## Work, file by file

### 1. `supabase/migrations/0002_site_map_url.sql` (new)
```sql
-- Optional map link per site. Only http(s) URLs, so a stored value is always safe to put in an href.
alter table public.sites
  add column if not exists map_url text
  check (map_url is null or map_url ~* '^https?://');
```
Nothing else. The grants in `0001_init.sql` are table-wide, so the new column needs no new grant or policy. Running the file twice is harmless (the second run skips with a notice).

### 2. `src/lib/mapLink.ts` (new)
Exactly this:
```ts
/** Site map links. A technician pastes a map link, or bare GPS coordinates, into the site dialog. */

export const MAP_LINK_ERROR =
  'Map link must be a web link (starting with https://) or coordinates like 31.5521, -97.1467.'

const URL_IN_TEXT = /https?:\/\/[^\s<>"']+/i
const COORDS = /^\(?\s*(-?\d{1,3}(?:\.\d+)?)\s*(?:,\s*|\s+)(-?\d{1,3}(?:\.\d+)?)\s*\)?$/
const MAX_LENGTH = 2000

/**
 * Turns what the technician typed into the URL to store, or null when the field is blank.
 * Text containing a web link keeps only the first http(s) link. Bare coordinates
 * ("31.5521, -97.1467") become a Google Maps link to that point. Anything else throws MAP_LINK_ERROR.
 */
export function parseMapLink(raw: string): string | null {
  const text = raw.trim()
  if (text === '') return null
  const found = text.match(URL_IN_TEXT)
  if (found) {
    const url = found[0].replace(/[.,;:!?]+$/, '')
    if (url.length > MAX_LENGTH) throw new Error(MAP_LINK_ERROR)
    return url
  }
  const coords = text.match(COORDS)
  if (coords) {
    const [, lat, lng] = coords
    if (Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    }
  }
  throw new Error(MAP_LINK_ERROR)
}

/** The stored link when it is safe to use as an href (http or https only), otherwise null. */
export function mapHref(url: string | null): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null
}
```

### 3. `src/lib/db.ts`
3.1. Add `import { parseMapLink } from './mapLink'` under the existing `supabase` import.

3.2. `Site`: add `map_url: string | null` after `notes`.

3.3. `SiteInput`: add `map_url: string` after `notes`.

3.4. In both `createSite` and `updateSite`, add `map_url: parseMapLink(input.map_url),` after the `notes:` line in the object passed to `.insert(...)` / `.update(...)`. `parseMapLink` throws before any request is sent, the same way `requireName` does, so the page's `run()` shows the error toast and keeps the dialog open. Do not catch it.

Nothing else in `db.ts` changes. `getSite` and `listSiteSummaries` already select `*`, so `map_url` arrives on its own.

### 4. `src/pages/SitesPage.tsx`
4.1. Add to `SITE_FIELDS`, as the last entry:
```ts
{ name: 'map_url', label: 'Map link', placeholder: 'Paste a map link or GPS coordinates' },
```
4.2. Add dialog: `createSite({ name: v.name, site_type: v.site_type, notes: v.notes, map_url: v.map_url })`.

4.3. Edit dialog: add `map_url: dialog.site.map_url ?? '',` to `initial`, and `map_url: v.map_url` to the `updateSite` call.

TypeScript will not let you forget 4.2 or 4.3 once `SiteInput` has the new field. If it compiles without them, you edited the wrong interface.

### 5. `src/pages/SiteDetailPage.tsx`
5.1. Add `import { mapHref } from '../lib/mapLink'` with the other `../lib/` imports.

5.2. Inside the `data && (...)` branch you cannot declare a variable, so compute it next to `hasReadingTypes`:
```ts
const mapUrl = data ? mapHref(data.site.map_url) : null
```
5.3. Replace the `PageBanner` `action` prop with:
```tsx
action={
  <>
    <Link to="/" className={outlineOnDarkButtonClass + ' inline-flex items-center'}>
      ← Back to sites
    </Link>
    {mapUrl && (
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={outlineOnDarkButtonClass + ' inline-flex items-center'}
      >
        Open map ↗
      </a>
    )}
  </>
}
```
Always go through `mapHref`. Never put `data.site.map_url` into an `href` directly.

### 6. Docs
6.1. `README.md`, folder layout: under the `0001_init.sql` line add `    migrations/0002_site_map_url.sql  adds sites.map_url` (match the alignment of the lines around it).

6.2. `README.md`, "Behavior to know about": add one bullet after the search box one: *Each site can have a **map link**. Paste a map link or bare GPS coordinates (`31.5521, -97.1467`, which become a Google Maps link) in the site dialog; the site page then shows an "Open map" button. Only http and https links are accepted, in the app and in the database.*

6.3. `DEPLOY.md`, Step 2: after 2.5 add *2.5a. Click **New query** again and repeat 2.3 to 2.5 with `supabase/migrations/0002_site_map_url.sql`. You should see "Success. No rows returned" again.* Leave the "five tables" check as it is.

## Rules that are easy to break
- **Do not apply SQL to any Supabase project yourself.** The Supabase connector in this session cannot see the dev database. Give Will the contents of `0002_site_map_url.sql` to paste into the dev project's SQL editor, https://supabase.com/dashboard/project/prvvmnjlkqjejykkklrx/sql/new, and wait until he says it ran. Never touch project `xwvxxjsszhgmqjgrawsi` (Verdun, live) or `plpuagvohnepvdeuqvhu`.
- The live client database must get this migration **before** this code is pushed, or every site save there fails. That is Will's job, not yours. Say it in your report.
- Read-only mode means no edit controls in the DOM. Logged out, a site page must still have no element with exact text `+ Add site`, `Edit`, `Delete`, `Save`, `+ New entry` or `+ Add equipment`. `Open map ↗` is allowed.
- Every query stays in `src/lib/db.ts`. `mapLink.ts` is pure string work and must not import `supabase`.
- No hex or rgb color literals in `src/`. Tap targets at least 44px tall (`outlineOnDarkButtonClass` already has `min-h-[44px]`).
- Do not change `FieldsDialog.tsx`. The new field is a plain text input; do not make it `type="url"` (phone URL keyboards make the comma for coordinates hard to reach).
- `npm run build` must finish with zero TypeScript errors. On Will's PowerShell use `npm.cmd` and `npx.cmd`.
- Do not run `supabase/seed.sql` anywhere. Do not edit it. Do not deploy. Do not push. Do not touch `.env` or `.env.local`.
- In the Bash tool here, long heredocs fail. Use the Write and Edit tools to create and change files.

## Verification
The local dev server uses the dev database in `.env` (`rise-safety-dev`), which holds Alpha Yard (type Tank battery) and Bravo Pad (type Well pad), and possibly a site named `test`. This database also backs Zach's demo site, so clean up anything you add except where this script says to keep it. `.env.local` makes the app show the Verdun brand; leave that alone. Start the server with the Browser pane's `preview_start` using the `dev` configuration in `.claude/launch.json`.

1. `npm run build`: zero TypeScript errors.
2. **Parser check.** Create `scripts/map-link-check.ts` that imports `parseMapLink`, `mapHref` and `MAP_LINK_ERROR` from `'../src/lib/mapLink'`, runs every row below, prints PASS or FAIL per row, and exits non-zero on any FAIL. "throws" means it throws an `Error` whose message equals `MAP_LINK_ERROR`. Run it with `npx.cmd tsx scripts/map-link-check.ts`. All rows must pass. Then **delete the file**; it is not committed.

   | # | Call | Expected |
   |---|------|----------|
   | 1 | `parseMapLink('')` | `null` |
   | 2 | `parseMapLink('   ')` | `null` |
   | 3 | `parseMapLink('https://maps.app.goo.gl/AbC123')` | `https://maps.app.goo.gl/AbC123` |
   | 4 | `parseMapLink('  https://maps.app.goo.gl/AbC123  ')` | `https://maps.app.goo.gl/AbC123` |
   | 5 | `parseMapLink('Bravo Pad: https://maps.app.goo.gl/AbC123.')` | `https://maps.app.goo.gl/AbC123` |
   | 6 | `parseMapLink('HTTP://example.com/map')` | `HTTP://example.com/map` |
   | 7 | `parseMapLink('https://www.google.com/maps/@31.5,-97.1,15z')` | `https://www.google.com/maps/@31.5,-97.1,15z` |
   | 8 | `parseMapLink('31.5521, -97.1467')` | `https://www.google.com/maps/search/?api=1&query=31.5521,-97.1467` |
   | 9 | `parseMapLink('31.5521,-97.1467')` | same as 8 |
   | 10 | `parseMapLink('31.5521 -97.1467')` | same as 8 |
   | 11 | `parseMapLink('(31.5521, -97.1467)')` | same as 8 |
   | 12 | `parseMapLink('91, 10')` | throws |
   | 13 | `parseMapLink('31.5, -181')` | throws |
   | 14 | `parseMapLink('javascript:alert(1)')` | throws |
   | 15 | `parseMapLink('maps.app.goo.gl/AbC123')` | throws |
   | 16 | `parseMapLink('31°33\'07.6"N 97°08\'48.1"W')` | throws |
   | 17 | `mapHref(null)` | `null` |
   | 18 | `mapHref('javascript:alert(1)')` | `null` |
   | 19 | `mapHref('https://maps.app.goo.gl/AbC123')` | `https://maps.app.goo.gl/AbC123` |

3. Give Will the SQL from `0002_site_map_url.sql` and the dev SQL editor link (see the rules). Wait for him to confirm it ran. Then ask him to run `select column_name from information_schema.columns where table_schema = 'public' and table_name = 'sites' and column_name = 'map_url';` and confirm it returns one row.
4. Log in (ask Will to type the password in the Browser pane if you cannot). Each step pass or fail:
   1. Open Bravo Pad. No `Open map ↗` in the banner.
   2. On the Sites page, Edit Alpha Yard. The dialog shows Name, Site type, Notes, Map link, in that order, and Map link is empty.
   3. Type `javascript:alert(1)` into Map link and Save. The error toast reads exactly `Map link must be a web link (starting with https://) or coordinates like 31.5521, -97.1467.` and the dialog stays open.
   4. Replace it with `https://maps.app.goo.gl/test123` and Save. Toast `Site saved`. Open Alpha Yard: the banner has `Open map ↗`, and its `href` is `https://maps.app.goo.gl/test123`, `target` is `_blank`, `rel` is `noopener noreferrer` (check with `read_page` or `javascript_tool`).
   5. Edit Alpha Yard, clear Map link, Save. Alpha Yard's page has no `Open map ↗`.
   6. Edit Alpha Yard, type `31.5521, -97.1467`, Save. Alpha Yard's `Open map ↗` `href` is `https://www.google.com/maps/search/?api=1&query=31.5521,-97.1467`. Click it: a new tab opens on a `google.com` origin (check `tabs_context`). Close that tab. Edit Alpha Yard again: the Map link field shows that Google URL. Cancel. **Keep this link on Alpha Yard**; it doubles as a demo for Zach.
   7. `+ Add site` with Name `Map test` and Map link `Site: https://www.google.com/maps/@31.5,-97.1,15z`. Open Map test: `href` is `https://www.google.com/maps/@31.5,-97.1,15z`. Then delete the Map test site.
5. Log out. At 390px, screenshot Alpha Yard's page with `Open map ↗` in the banner, and at 1280px screenshot it again. Run the logged-out DOM check from "Rules that are easy to break" on Alpha Yard's page.
6. `npm run build` again: zero errors. `git status` shows no `scripts/map-link-check.ts`.
7. Commit with the message `Sites: optional map link (paste a link or GPS coordinates), Open map button on the site page`. Do not push.

## When done
Stop and report: each verification step pass or fail with the screenshots, the parser check output, the final `npm run build` output, a reminder that `0002_site_map_url.sql` must be run on the Verdun database (`xwvxxjsszhgmqjgrawsi`) before this is pushed, anything left undone, and any place this prompt was ambiguous and what you chose.
