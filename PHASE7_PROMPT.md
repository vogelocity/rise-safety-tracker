Read `README.md` in full. Work in this folder. Phases 1 to 6 are done and committed on `main`; run `git log --oneline -3` and confirm the top commit is the Phase 6 one (`Reading type presets; accept "ohm" as the unit`) before you start. The app is live for a real client. This phase adds one feature and nothing else.

## Before writing any code
In one paragraph, tell me how you will verify this phase. Then start.

## The feature
A search box on the Sites page that filters the list of sites as you type. A client with forty sites should find "Bravo Pad" without scrolling.

**Behavior**
- Placed in the "All sites" header row, to the right of the label on wide screens and full width on phones.
- Placeholder `Search sites`. It is a `type="search"` input so phones show their own clear button.
- Filters on every keystroke; there is no search button. Case-insensitive, matches anywhere in the site **name** and also in the site **type**, so `pad` finds every well pad.
- When the filter matches nothing, the card shows `No sites match “pad”.` (with the typed text, curly quotes as written here) instead of `No sites yet.`
- Shown to everyone, logged in or not. It is not an edit control. Edit mode's `Edit` buttons keep working on the filtered rows.
- Not remembered: reloading the page shows the full list with an empty box.
- Always shown when the list has at least one site. When there are no sites at all, there is nothing to search, so the box is not rendered.

## Work, file by file

### 1. `src/components/SitesTable.tsx`
Add an optional prop and use it in the empty state. Nothing else changes.
```ts
interface Props {
  sites: SiteSummary[]
  /** Edit mode only. When absent, no Edit control is rendered at all. */
  onEdit?: (site: SiteSummary) => void
  /** Shown when `sites` is empty. Defaults to "No sites yet." */
  emptyMessage?: string
}
```
In the function signature add `emptyMessage = 'No sites yet.'`, and in the empty branch replace the literal text with `{emptyMessage}`.

### 2. `src/pages/SitesPage.tsx`
2.1. Import `inputClass` from `'../components/Modal'` (it already imports `outlineOnDarkButtonClass` and `primaryButtonClass` from there; extend that line).

2.2. Add state next to the existing `useState` calls:
```ts
const [query, setQuery] = useState('')
```

2.3. After the `run` function and before the `return`, compute the filtered list:
```ts
const allSites = state.status === 'ready' ? state.data : []
const q = query.trim().toLowerCase()
const visibleSites = q
  ? allSites.filter((s) => s.name.toLowerCase().includes(q) || (s.site_type ?? '').toLowerCase().includes(q))
  : allSites
```

2.4. Replace the block that renders the "All sites" label and the table (the `state.status === 'ready' && (...)` fragment) with:
```tsx
{state.status === 'ready' && (
  <>
    <div className="mb-3 mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="font-display text-xs font-semibold uppercase tracking-[0.15em] text-muted">All sites</div>
      {allSites.length > 0 && (
        <input
          type="search"
          inputMode="search"
          autoComplete="off"
          aria-label="Search sites"
          placeholder="Search sites"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputClass} sm:w-64`}
        />
      )}
    </div>
    <SitesTable
      sites={visibleSites}
      emptyMessage={q ? `No sites match “${query.trim()}”.` : 'No sites yet.'}
      onEdit={isEditor ? (site) => setDialog({ kind: 'edit', site }) : undefined}
    />
  </>
)}
```
Keep the add / edit / delete dialogs and `run()` exactly as they are. Do not filter inside `SitesTable`; the page filters and the table only displays.

### 3. Docs
`README.md`, "Behavior to know about": add one line, *The Sites page has a search box that filters by site name or type as you type. It is not remembered between visits.*

## Rules that are easy to break
- Read-only mode means no edit controls in the DOM. The search box is the **one** input a logged-out page may contain now. Logged out, confirm the page has exactly one `<input>` and it has `aria-label="Search sites"`, and still no element with exact text `+ Add site`, `Edit`, `Delete` or `Save`.
- Every query stays in `src/lib/db.ts`. This phase does not touch it: filtering is in the browser, on the list that is already loaded.
- No hex or rgb color literals in `src/`.
- Tap targets at least 44px tall (`inputClass` already has `min-h-[44px]`).
- `npm run build` must finish with zero TypeScript errors. On Will's PowerShell use `npm.cmd`.
- Do not run `supabase/seed.sql` anywhere. Do not deploy. Do not push. Do not touch `.env` or `.env.local`.
- In the Bash tool here, long heredocs fail. Use the Write and Edit tools to create and change files.

## Verification
The local dev server uses the dev database in `.env`, which holds Alpha Yard (type Tank battery) and Bravo Pad (type Well pad), and possibly a site named `test`. `.env.local` makes it show the Verdun brand; leave that alone. Start the server with the Browser pane's `preview_start` using the `dev` configuration in `.claude/launch.json`.

1. `npm run build`: zero TypeScript errors.
2. Logged out, at 390px: screenshot the Sites page showing the search box under the banner. Run the DOM check from "Rules that are easy to break".
3. Script, logged out, each step pass or fail:
   1. Type `pad`. Only Bravo Pad is listed.
   2. Clear it and type `ALPHA`. Only Alpha Yard is listed (case does not matter).
   3. Type `tank`. Alpha Yard is listed, because its type is Tank battery.
   4. Type `zzz`. The card reads `No sites match “zzz”.`
   5. Clear the box. Every site is listed again.
   6. Reload the page. The box is empty and every site is listed.
4. Log in (ask Will to type the password in the Browser pane if you cannot). Type `pad`: Bravo Pad is listed with its `Edit` button, and `+ Add site` is still in the banner. Clear the box, log out.
5. Commit with the message `Sites page: search box filtering by name and type`. Do not push.

## When done
Stop and report: each verification step pass or fail with the screenshot, the final `npm run build` output, anything left undone, and any place this prompt was ambiguous and what you chose.
