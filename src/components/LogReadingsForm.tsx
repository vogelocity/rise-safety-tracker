import { useState } from 'react'
import { findSession, saveSession } from '../lib/db'
import type { EquipmentWithTypes, Reading, ReadingSession } from '../lib/db'
import { formatDate, todayLocalIso } from '../lib/dates'
import ConfirmDialog from './ConfirmDialog'
import { readingTypeLabel } from './EquipmentList'
import EntryPanel from './EntryPanel'
import { dangerButtonClass, inputClass, primaryButtonClass, secondaryButtonClass } from './Modal'
import ReadingsSheet from './ReadingsSheet'
import { useToast } from './Toast'

// The technician's last name is the only thing this app keeps in localStorage.
const TECHNICIAN_KEY = 'rise-safety.technician'

function readTechnician(): string {
  try {
    return localStorage.getItem(TECHNICIAN_KEY) ?? ''
  } catch {
    return ''
  }
}

function rememberTechnician(name: string): void {
  try {
    localStorage.setItem(TECHNICIAN_KEY, name)
  } catch {
    // Storage can be unavailable (private mode). Remembering the name is a convenience only.
  }
}

interface Props {
  siteId: string
  siteName: string
  equipment: EquipmentWithTypes[]
  /** The session being edited, or null when logging a new one. */
  session: ReadingSession | null
  /** Readings for `session`. Ignored when `session` is null. */
  readings: Reading[]
  onClose: () => void
  /** Called after a successful save so the page can refetch. */
  onSaved: () => void
  /** Passed only when editing an existing entry. When absent, no delete control is rendered. */
  onDelete?: () => Promise<void>
}

/**
 * Full-screen form: date, technician, and one input per reading type grouped by equipment.
 * New session: blank inputs are left alone, and a clash with an existing session for that date asks
 * before updating it. Edit: prefilled, the date is fixed, and a cleared input deletes its reading.
 */
export default function LogReadingsForm({
  siteId,
  siteName,
  equipment,
  session,
  readings,
  onClose,
  onSaved,
  onDelete,
}: Props) {
  const toast = useToast()
  const editing = session !== null
  const [date, setDate] = useState(() => session?.reading_date ?? todayLocalIso())
  const [technician, setTechnician] = useState(() => (session ? (session.technician ?? '') : readTechnician()))
  const [values, setValues] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {}
    if (session) for (const r of readings) if (r.session_id === session.id) out[r.reading_type_id] = r.value
    return out
  })
  const [saving, setSaving] = useState(false)
  const [confirmUpdate, setConfirmUpdate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const groups = equipment.filter((e) => e.reading_types.length > 0)

  async function write() {
    setSaving(true)
    try {
      await saveSession({ siteId, date, technician, values, deleteCleared: editing })
      if (technician.trim() !== '') rememberTechnician(technician.trim())
      toast.success('Readings saved')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
      setSaving(false)
      setConfirmUpdate(false)
    }
  }

  async function remove() {
    if (!onDelete) return
    setSaving(true)
    try {
      await onDelete()
      toast.success('Entry deleted')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
      setSaving(false)
      setConfirmDelete(false)
    }
  }

  async function save() {
    if (saving) return
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      toast.error('Pick a date.')
      return
    }
    if (!Object.values(values).some((v) => v.trim() !== '')) {
      toast.error('Enter at least one reading.')
      return
    }
    if (!editing) {
      // A new session can collide with one already logged for that site and date.
      setSaving(true)
      try {
        const existing = await findSession(siteId, date)
        setSaving(false)
        if (existing) {
          setConfirmUpdate(true)
          return
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err))
        setSaving(false)
        return
      }
    }
    await write()
  }

  const saveButton = (
    <button type="button" onClick={save} disabled={saving} className={primaryButtonClass}>
      {saving ? 'Saving…' : 'Save'}
    </button>
  )

  return (
    <EntryPanel
      title={editing ? 'Edit entry' : 'New entry'}
      siteName={siteName}
      closeLabel="← Cancel"
      // Escape must not close the form while a confirm dialog is open or a write is in flight.
      onClose={() => {
        if (!saving && !confirmUpdate && !confirmDelete) onClose()
      }}
      primaryAction={saveButton}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="log-date" className="block text-sm">
            Date
          </label>
          {editing ? (
            <div id="log-date" className="mt-1 flex min-h-[44px] items-center">
              {formatDate(date)}
            </div>
          ) : (
            <input
              id="log-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${inputClass} mt-1`}
            />
          )}
        </div>
        <div>
          <label htmlFor="log-technician" className="block text-sm">
            Technician
          </label>
          <input
            id="log-technician"
            type="text"
            autoComplete="name"
            value={technician}
            onChange={(e) => setTechnician(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-muted">Add a reading type to a piece of equipment before logging readings.</p>
      ) : (
        <ReadingsSheet
          equipment={groups}
          renderValue={(t) => (
            <input
              type="text"
              // "text", not "decimal": the iOS decimal keypad has no "<" or letter keys,
              // and values such as "<1", "OL" and "N/A" are valid.
              inputMode="text"
              autoComplete="off"
              aria-label={readingTypeLabel(t.name, t.unit)}
              value={values[t.id] ?? ''}
              onChange={(ev) => setValues((v) => ({ ...v, [t.id]: ev.target.value }))}
              className={`${inputClass} ${values[t.id]?.trim() ? 'border-success bg-success/10' : ''}`}
            />
          )}
        />
      )}

      <div className="flex items-center justify-between gap-2 pb-6">
        <div>
          {onDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              className={dangerButtonClass}
            >
              Delete entry
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>
            Cancel
          </button>
          {saveButton}
        </div>
      </div>

      {confirmUpdate && (
        <ConfirmDialog
          title="Update readings?"
          message="Readings already exist for this date. Update them?"
          confirmLabel="Update"
          busy={saving}
          onConfirm={write}
          onCancel={() => setConfirmUpdate(false)}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete entry?"
          message={`Delete the ${formatDate(date)} entry? This deletes every reading in it. This cannot be undone.`}
          confirmLabel="Delete entry"
          danger
          busy={saving}
          onConfirm={remove}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </EntryPanel>
  )
}
