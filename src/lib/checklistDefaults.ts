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
