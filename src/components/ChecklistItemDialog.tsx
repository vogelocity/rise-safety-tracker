import { useState, type FormEvent } from 'react'
import { sameName } from '../lib/checklist'
import type { ChecklistItemKind } from '../lib/db'
import Modal, { inputClass, primaryButtonClass, secondaryButtonClass } from './Modal'
import { useToast } from './Toast'

export interface ChecklistItemDialogValues {
  section: string
  group: string
  label: string
  kind: ChecklistItemKind
  unit: string
  alsoForSite: boolean
}

interface Props {
  /** Add an item to an existing section, or add a new section with its first item. */
  mode: { kind: 'item'; section: string } | { kind: 'section' }
  siteName: string
  /** The checklist's sections and their group names, to reuse existing spellings. */
  sections: { name: string; groups: string[] }[]
  busy: boolean
  onSubmit: (values: ChecklistItemDialogValues) => void
  onCancel: () => void
}

/** Adds a checklist item, or a section with its first item. */
export default function ChecklistItemDialog({ mode, siteName, sections, busy, onSubmit, onCancel }: Props) {
  const toast = useToast()
  const addingSection = mode.kind === 'section'
  const [section, setSection] = useState('')
  const [label, setLabel] = useState('')
  const [group, setGroup] = useState('')
  const [kind, setKind] = useState<ChecklistItemKind>('check')
  const [unit, setUnit] = useState('')
  const [alsoForSite, setAlsoForSite] = useState(true)
  const [missing, setMissing] = useState<'section' | 'label' | null>(null)

  const groupNames = mode.kind === 'item' ? (sections.find((s) => s.name === mode.section)?.groups ?? []) : []

  function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    if (addingSection && section.trim() === '') {
      setMissing('section')
      return
    }
    if (label.trim() === '') {
      setMissing('label')
      return
    }
    if (addingSection && sections.some((s) => sameName(s.name, section))) {
      toast.error('That section already exists. Use + Add item in it.')
      return
    }
    // A typed group that matches an existing one keeps the existing spelling.
    const existingGroup = groupNames.find((g) => sameName(g, group))
    onSubmit({
      section: mode.kind === 'item' ? mode.section : section,
      group: existingGroup ?? group,
      label,
      kind,
      unit: kind === 'value' ? unit : '',
      alsoForSite,
    })
  }

  const title = mode.kind === 'item' ? `Add item to ${mode.section}` : 'Add section'
  const radioRow = 'flex min-h-[44px] items-center gap-2'

  return (
    <Modal title={title} onClose={onCancel}>
      <form onSubmit={submit} className="space-y-3">
        {addingSection && (
          <div>
            <label htmlFor="checklist-section" className="block text-sm">
              Section
            </label>
            <input
              id="checklist-section"
              type="text"
              autoFocus
              value={section}
              onChange={(e) => {
                setSection(e.target.value)
                if (missing === 'section') setMissing(null)
              }}
              className={`${inputClass} mt-1`}
            />
            {missing === 'section' && <p className="mt-1 text-sm text-danger">Section is required.</p>}
          </div>
        )}
        <div>
          <label htmlFor="checklist-item" className="block text-sm">
            Item
          </label>
          <input
            id="checklist-item"
            type="text"
            autoFocus={!addingSection}
            placeholder="For example: Gauge reads zero at rest"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value)
              if (missing === 'label') setMissing(null)
            }}
            className={`${inputClass} mt-1`}
          />
          {missing === 'label' && <p className="mt-1 text-sm text-danger">Item is required.</p>}
        </div>
        <div>
          <label htmlFor="checklist-group" className="block text-sm">
            Group
          </label>
          <input
            id="checklist-group"
            type="text"
            list={groupNames.length > 0 ? 'checklist-group-names' : undefined}
            placeholder="Optional, for example: Main Monitor"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className={`${inputClass} mt-1`}
          />
          {groupNames.length > 0 && (
            <datalist id="checklist-group-names">
              {groupNames.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          )}
        </div>
        <fieldset>
          <legend className="block text-sm">Type</legend>
          <div className="flex flex-wrap gap-x-6">
            <label className={radioRow}>
              <input
                type="radio"
                name="checklist-kind"
                checked={kind === 'check'}
                onChange={() => setKind('check')}
                className="h-5 w-5 accent-primary"
              />
              Checkbox
            </label>
            <label className={radioRow}>
              <input
                type="radio"
                name="checklist-kind"
                checked={kind === 'value'}
                onChange={() => setKind('value')}
                className="h-5 w-5 accent-primary"
              />
              Written value
            </label>
          </div>
        </fieldset>
        {kind === 'value' && (
          <div>
            <label htmlFor="checklist-unit" className="block text-sm">
              Unit
            </label>
            <input
              id="checklist-unit"
              type="text"
              placeholder="Optional, for example: PSI"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={`${inputClass} mt-1`}
            />
          </div>
        )}
        <label className="flex min-h-[44px] items-center gap-3">
          <input
            type="checkbox"
            checked={alsoForSite}
            onChange={(e) => setAlsoForSite(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-primary"
          />
          <span>Also add to future checklists at {siteName}</span>
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} disabled={busy} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy ? 'Saving…' : addingSection ? 'Add section' : 'Add item'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
