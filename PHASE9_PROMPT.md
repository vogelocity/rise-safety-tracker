Read `README.md` in full. Work in this folder. Phases 1 to 8 are done and committed on `main`; run `git log --oneline -6` and confirm the Phase 8 commit (`Sites: optional map link (paste a link or GPS coordinates), Open map button on the site page`) is in the list before you start. The app is live for a real client. This phase adds one feature and nothing else. No database change.

## Before writing any code
In one paragraph, tell me how you will verify this phase. Then start.

## The feature
An **Edit site** button on the site page, so a site entered wrong can be fixed from where you notice it. Today the only way is the `Edit` button on the Sites list.

**Behavior**
- Logged in (editor), the site page banner shows `Edit site` after `← Back to sites` and before `Open map ↗` (when that is shown).
- Logged out, the button is not in the DOM at all.
- It opens the same dialog as the Sites list's Edit: title `Edit site`, fields Name, Site type, Notes, Map link, prefilled, with `Delete site` on the left.
- Save: toast `Site saved`, the dialog closes, and the banner shows the new values without a full reload (the page's `run()` already refetches quietly).
- A bad map link shows the existing error toast and keeps the dialog open, exactly as on the Sites list.
- `Delete site` opens the same confirmation as the Sites list (`Delete site?`, same message, `Delete site` button). Confirming deletes the site, toasts `Site deleted`, and navigates to `/`. Cancel goes back to nothing open.
- The Sites list's Edit keeps working exactly as before.

## Work, file by file

### 1. `src/components/siteFields.ts` (new)
One place for the site dialog's fields, so the two pages cannot drift apart:
```ts
import type { Site, SiteInput } from '../lib/db'
import type { Field } from './FieldsDialog'

/** The add / edit site dialog's fields, shared by the Sites page and the site page. */
export const SITE_FIELDS: Field[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'site_type', label: 'Site type', placeholder: 'For example: Well pad, Tank battery' },
  { name: 'notes', label: 'Notes', multiline: true },
  { name: 'map_url', label: 'Map link', placeholder: 'Paste a map link or GPS coordinates' },
]

/** A site's current values, for prefilling the edit dialog. */
export function siteFormValues(site: Site): Record<string, string> {
  return {
    name: site.name,
    site_type: site.site_type ?? '',
    notes: site.notes ?? '',
    map_url: site.map_url ?? '',
  }
}

/** The dialog's values as the input createSite / updateSite expect. */
export function siteInput(v: Record<string, string>): SiteInput {
  return { name: v.name, site_type: v.site_type, notes: v.notes, map_url: v.map_url }
}
```
Check that `Field` is exported from `FieldsDialog.tsx` (it is: `export interface Field`). Both imports are `import type`, so this file adds nothing to the bundle at runtime beyond the array and two functions.

### 2. `src/pages/SitesPage.tsx`
2.1. Delete the local `SITE_FIELDS` constant and add `import { SITE_FIELDS, siteFormValues, siteInput } from '../components/siteFields'`.

2.2. Add dialog: `await createSite(siteInput(v))`.

2.3. Edit dialog: `initial={siteFormValues(dialog.site)}` and `await updateSite(dialog.site.id, siteInput(v))`.

Nothing else on this page changes. `dialog.site` is a `SiteSummary`, which extends `Site`, so it type-checks as is.

### 3. `src/pages/SiteDetailPage.tsx`
3.1. Imports:
- `react-router-dom`: add `useNavigate` to the existing `{ Link, useParams }` import.
- `../lib/db`: add `deleteSite` and `updateSite` to the existing value import list (keep it alphabetical like the rest).
- Add `import { SITE_FIELDS, siteFormValues, siteInput } from '../components/siteFields'` next to the other `../components/` imports.
- `ConfirmDialog` and `FieldsDialog` are already imported.

3.2. Add two members to the `Dialog` union, before `| null`:
```ts
  | { kind: 'editSite' }
  | { kind: 'deleteSite' }
```

3.3. In the component, after `const toast = useToast()`:
```ts
const navigate = useNavigate()
```

3.4. After the `run` function, add a delete handler. It cannot use `run()`, because `run()` refetches a site that no longer exists and would show "Site not found":
```ts
/** Deletes the site, then leaves the page, since it no longer exists. */
async function removeSite(siteId: string) {
  setBusy(true)
  try {
    await deleteSite(siteId)
    toast.success('Site deleted')
    navigate('/')
  } catch (err) {
    toast.error(err instanceof Error ? err.message : String(err))
  } finally {
    setBusy(false)
  }
}
```
The toast provider is in `App.tsx`, above the routes, so the toast survives the navigation.

3.5. Banner `action`: insert the button between the `Link` and the `{mapUrl && (...)}` block:
```tsx
{editing && (
  <button
    type="button"
    onClick={() => setDialog({ kind: 'editSite' })}
    className={outlineOnDarkButtonClass}
  >
    Edit site
  </button>
)}
```

3.6. Inside the existing `{editing && data && dialog && (<>...</>)}` block, add as the first two entries:
```tsx
{dialog.kind === 'editSite' && (
  <FieldsDialog
    title="Edit site"
    fields={SITE_FIELDS}
    initial={siteFormValues(data.site)}
    busy={busy}
    onCancel={() => setDialog(null)}
    onDelete={{ label: 'Delete site', run: () => setDialog({ kind: 'deleteSite' }) }}
    onSubmit={(v) =>
      run(async () => {
        await updateSite(data.site.id, siteInput(v))
        return 'Site saved'
      })
    }
  />
)}

{dialog.kind === 'deleteSite' && (
  <ConfirmDialog
    title="Delete site?"
    message={`Delete "${data.site.name}"? This deletes all equipment and readings for that site. This cannot be undone.`}
    confirmLabel="Delete site"
    danger
    busy={busy}
    onCancel={() => setDialog(null)}
    onConfirm={() => removeSite(data.site.id)}
  />
)}
```
The message must match the Sites page's message character for character.

### 4. Docs
`README.md`, "Behavior to know about", change the "Deleting a site" bullet to: *Deleting a site deletes all its equipment, reading types, sessions and readings. The confirmation says so. A site can be edited or deleted from the Sites list or from its own page (`Edit site`).*

## Rules that are easy to break
- Read-only mode means no edit controls in the DOM. Logged out, a site page must have no element with exact text `Edit site`, `+ Add site`, `Edit`, `Delete`, `Save`, `+ New entry` or `+ Add equipment`. `← Back to sites` and `Open map ↗` are allowed.
- Every query stays in `src/lib/db.ts`. This phase adds no query and does not change `db.ts`.
- Do not change `FieldsDialog.tsx`, `ConfirmDialog.tsx` or `mapLink.ts`.
- No hex or rgb color literals in `src/`. Tap targets at least 44px tall (`outlineOnDarkButtonClass` already has `min-h-[44px]`).
- `npm run build` must finish with zero TypeScript errors (`noUnusedLocals` is on, so remove anything left unused). On Will's PowerShell use `npm.cmd`.
- Do not apply SQL to any database. Do not run `supabase/seed.sql` or `supabase/example_site.sql`. Do not deploy. Do not push. Do not touch `.env` or `.env.local`.
- In the Bash tool here, long heredocs fail. Use the Write and Edit tools to create and change files.

## Verification
The local dev server uses the dev database in `.env` (`rise-safety-dev`), which holds Alpha Yard (type Tank battery, with a map link) and Bravo Pad (type Well pad, no notes, no map link), and possibly a site named `test`. Put everything back the way you found it. `.env.local` makes the app show the Verdun brand; leave that alone. Start the server with the Browser pane's `preview_start` using the `dev` configuration in `.claude/launch.json` (if port 5173 is taken, say which port it used).

1. `npm run build`: zero TypeScript errors.
2. Logged out, open Alpha Yard. Run the DOM check from "Rules that are easy to break". Screenshot the banner at 390px.
3. Log in (ask Will to type the password in the Browser pane if you cannot). Each step pass or fail:
   1. Alpha Yard's banner shows `← Back to sites`, `Edit site`, `Open map ↗`, in that order. Screenshot at 390px and 1280px.
   2. Click `Edit site`. The dialog title is `Edit site`; Name is `Alpha Yard`, Site type `Tank battery`, Notes the gate code sentence, Map link the Google URL. Cancel. Nothing changed.
   3. Open Bravo Pad, `Edit site`, set Notes to `Phase 9 test`, Save. Toast `Site saved`; the banner subtitle reads `Phase 9 test` without a page reload. Edit again, clear Notes, Save. The subtitle is gone.
   4. On Bravo Pad, `Edit site`, Map link `javascript:alert(1)`, Save. The map link error toast shows and the dialog stays open. Cancel. Bravo Pad still has no `Open map ↗`.
   5. On the Sites page, `+ Add site` with Name `Phase 9 delete test`. Open it, `Edit site`, `Delete site`. The confirmation reads `Delete "Phase 9 delete test"? This deletes all equipment and readings for that site. This cannot be undone.` Click Cancel: nothing is open and the site page is still there. Do it again and confirm: toast `Site deleted`, the URL is `/`, and the site is not in the list.
   6. On the Sites page, the row `Edit` for Alpha Yard still opens a prefilled dialog. Cancel.
4. Log out. Run the DOM check again on Alpha Yard.
5. `npm run build` again: zero errors.
6. Commit with the message `Site page: Edit site button (edit or delete from the site itself)`. Do not push.

## When done
Stop and report: each verification step pass or fail with the screenshots, the final `npm run build` output, anything left undone, and any place this prompt was ambiguous and what you chose.
