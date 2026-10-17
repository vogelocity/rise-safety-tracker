// Writes a sample checklist PDF, built by the same code the app uses, so the layout can be checked
// without a browser or a database.
//
// Usage:  npm run pdf-sample -- <output.pdf>
import { writeFile } from 'node:fs/promises'
import { groupChecklist, type ChecklistItemLike } from '../src/lib/checklist'
import { CHECKLIST_DEFAULTS } from '../src/lib/checklistDefaults'
import { buildChecklistPdf } from '../src/lib/checklistPdf'

const out = process.argv[2]
if (!out) {
  console.error('Usage: npm run pdf-sample -- <output.pdf>')
  process.exit(2)
}

let ticked = 0
const items: ChecklistItemLike[] = CHECKLIST_DEFAULTS.map((d, i) => {
  const checked = d.kind === 'check' && ticked < 10
  if (checked) ticked++
  return {
    section: d.section,
    group_name: d.group,
    label: d.label,
    kind: d.kind,
    unit: d.unit,
    checked,
    value: d.label === 'Unit 1' ? '2200' : null,
    sort_order: i,
  }
})

// One added item with a 200-character label, to show wrapping.
const longLabel = (
  'Added item with a deliberately long label to check that text wraps onto a second line inside the ' +
  'checklist PDF without running past the right margin or overlapping the next item on the page here.'
).slice(0, 200)
items.push({
  section: 'Gas Detection System',
  group_name: 'Main Monitor',
  label: longLabel.padEnd(200, '.'),
  kind: 'check',
  unit: null,
  checked: false,
  value: null,
  sort_order: items.length,
})

const deficiencies = Array.from(
  { length: 6 },
  (_, i) =>
    `${i + 1}. Sample deficiency ${i + 1}: describe what was found, where it was found, and the corrective ` +
    'action taken or still needed, so the text runs over several lines and onto the second page.',
).join('\n')

const blob = await buildChecklistPdf({
  companyName: 'Sample Company',
  footerText: 'Maintained by Rise Safety',
  logo: null,
  siteName: 'Sample Site',
  date: '2026-10-17',
  technician: 'Sample Tech',
  sections: groupChecklist(items),
  deficiencies,
  generatedOn: '2026-10-17',
})

await writeFile(out, Buffer.from(await blob.arrayBuffer()))
console.log(`Wrote ${out} (${blob.size} bytes)`)
