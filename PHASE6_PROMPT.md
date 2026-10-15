Read `README.md` in full. Work in this folder. Phases 1 to 5 are done, verified and deployed; the app is live for a real client. This phase is a small usability change and nothing else. Do not touch anything not listed here.

## Before writing any code
In one paragraph, tell me how you will verify this phase. Then start.

## The problem
When a technician adds a reading type to a piece of equipment, the dialog asks for a name and a unit. The most common unit is the ohm symbol, `Ω`, which is buried on a phone keyboard. Nobody should have to find it.

## The change (two parts)

### Part 1. Tap-to-fill presets in the reading type dialog
A row of chips above the two fields. Tapping a chip fills both fields; the fields stay editable for anything unusual.

1.1. Create `src/lib/readingTypePresets.ts`:
```ts
/** Common reading types. Tapping one in the dialog fills the name and unit; the fields stay editable. */
export interface ReadingTypePreset {
  label: string
  values: { name: string; unit: string }
}

export const READING_TYPE_PRESETS: ReadingTypePreset[] = [
  { label: 'Ohms (Ω)', values: { name: 'Ohms', unit: 'Ω' } },
  { label: 'Voltage (V)', values: { name: 'Voltage', unit: 'V' } },
  { label: 'Amps (A)', values: { name: 'Amps', unit: 'A' } },
  { label: 'Pressure (psi)', values: { name: 'Pressure', unit: 'psi' } },
  { label: 'Temperature (°F)', values: { name: 'Temperature', unit: '°F' } },
]
```
The `Ω` in this file is the Greek capital omega, U+03A9, the same character the seed file and the existing data use. Copy it from `supabase/seed.sql` if in doubt.

1.2. `src/components/FieldsDialog.tsx`: add an optional prop and render the chips.
- Add to `Props`: `presets?: { label: string; values: Record<string, string> }[]`
- Inside the `<form>`, before the fields are mapped, when `presets` is present and non-empty, render:
```tsx
<div className="flex flex-wrap gap-2">
  {presets.map((p) => (
    <button
      key={p.label}
      type="button"
      onClick={() => {
        setValues((v) => ({ ...v, ...p.values }))
        setMissing(null)
      }}
      className="min-h-[44px] rounded-full border border-gray-300 bg-white px-3 text-sm"
    >
      {p.label}
    </button>
  ))}
</div>
```
- Nothing else in the file changes. Dialogs that do not pass `presets` look exactly as before.

1.3. `src/pages/SiteDetailPage.tsx`:
- Import `READING_TYPE_PRESETS` from `../lib/readingTypePresets`.
- In `TYPE_FIELDS`, change the unit field's placeholder from `'For example: Ω'` to `'Optional'`. The whole point is that nobody types that symbol; do not show it as a hint.
- Pass `presets={READING_TYPE_PRESETS}` to both the `addType` and the `editType` `FieldsDialog`.

### Part 2. Accept "ohm" typed as the unit
If someone ignores the chips and types the word, store the symbol anyway.

2.1. `src/lib/db.ts`: add next to `blankToNull`:
```ts
/**
 * Units are display text, but the ohm symbol is hard to type on a phone, so the word is accepted and
 * stored as the symbol. Also folds the "Ohm sign" code point (U+2126, which some keyboards insert)
 * into the Greek capital omega (U+03A9) that the rest of the data uses.
 */
function normalizeUnit(unit: string): string | null {
  const t = unit.trim()
  if (t === '') return null
  if (/^(ohm|ohms|Ω|Ω)$/i.test(t)) return 'Ω'
  return t
}
```
2.2. In `createReadingType` and `updateReadingType`, replace `unit: blankToNull(unit)` with `unit: normalizeUnit(unit)`. Nothing else in `db.ts` changes.

## Rules that are easy to break
- The chips live inside a dialog that only exists in edit mode, so the logged-out page still contains no new buttons. Confirm this; do not take it on faith.
- Every query stays in `src/lib/db.ts`. The only change there is `normalizeUnit` and its two call sites.
- Do not change the name field, the Copy reading types feature, the readings form, or any other dialog.
- No hex or rgb color literals in `src/`. The chip classes above use Tailwind's own `gray` utilities, which are already used in this file.
- Tap targets at least 44px tall (the chip class already has it).
- `npm run build` must finish with zero TypeScript errors. On Will's PowerShell use `npm.cmd`.
- Do not run `supabase/seed.sql` anywhere. Do not deploy. Do not push. Do not touch `.env` or `.env.local`.
- In the Bash tool here, long heredocs fail. Use the Write and Edit tools to create and change files.

## Verification
The local dev server uses the dev database in `.env` (Alpha Yard and Bravo Pad with demo data). `.env.local` makes it show the Verdun brand; leave that alone. Start the server with the Browser pane's `preview_start` using the `dev` configuration in `.claude/launch.json`.

1. `npm run build`: zero TypeScript errors.
2. Logged out: open Alpha Yard, Equipment tab. Confirm the page has no element with exact text `+ Add reading type`, `Ohms (Ω)` as a button, `Edit`, `Delete` or `Save`, and no `<input>`. (The existing read-only chips are `<span>` elements and are fine.)
3. Log in (ask Will to type the password in the Browser pane if you cannot). Screenshot at 390px: Alpha Yard → Equipment tab → `+ Add reading type` on Light Plant 1, showing the five preset chips above the fields and the unit placeholder reading `Optional`.
4. Script, each step pass or fail:
   1. In that dialog, tap `Pressure (psi)`. Name reads `Pressure`, unit reads `psi`. Save. Toast `Reading type added`; Light Plant 1 now shows the chip `Pressure (psi)`.
   2. `+ Add reading type` again. Type name `Resistance`, unit `ohms` (the word, lowercase). Save. The chip reads `Resistance (Ω)` with the symbol.
   3. Tap the `Resistance (Ω)` chip to edit it. The preset row is there too. Tap `Voltage (V)`, then change the name back to `Resistance` and the unit to `OHM`, save. Chip reads `Resistance (Ω)`.
   4. Delete both new types (edit → Delete → confirm). Light Plant 1 is back to `Ohms (Ω)` only.
   5. Open Bravo Pad → Equipment tab → `+ Add reading type` on Wellhead → `Cancel`. Nothing changed.
5. Log out → repeat step 2.
6. Confirm the database is unchanged: Alpha Yard still has 5 reading types and Bravo Pad 3 (count the chips on the Equipment tab).
7. Commit with the message `Reading type presets; accept "ohm" as the unit`. Do not push.

## When done
Stop and report: each verification step pass or fail with the screenshot, the final `npm run build` output, anything left undone, and any place this prompt was ambiguous and what you chose.
