import { useState } from 'react'
import { findSession, saveSession } from '../lib/db'
import type { EquipmentWithTypes, Reading, ReadingSession } from '../lib/db'
import { formatDate, todayLocalIso } from '../lib/dates'
import ConfirmDialog from './ConfirmDialog'
import { readingTypeLabel } from './EquipmentList'
import { inputClass, primaryButtonClass, secondaryButtonClass } from './Modal'
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
}

/**
 * Full-screen form: date, technician, and one input per reading type grouped by equipment.
 * New session: blank inputs are left alone, and a clash with an existing session for that date asks
 * before updating it. Edit: prefilled, the date is fixed, and a cleared input deletes its reading.
 */
export default function LogReadingsForm({ siteId, siteName, equipment, session, readings, onClose, onSaved }: Props) {
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

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-background text-text" role="dialog" aria-modal="true" aria-label="Log readings">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex min-h-[56px] w-full max-w-[900px] items-center gap-3 px-4">
          <button type="button" onClick={onClose} disabled={saving} className="min-h-[44px] text-sm underline">
            ← Cancel
          </button>
          <div className="min-w-0 flex-1 truncate text-center font-semibold">
            {editing ? 'Edit session' : 'Log readings'} · {siteName}
          </div>
          <button type="button" onClick={save} disabled={saving} className={primaryButtonClass}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[900px] space-y-6 px-4 py-6">
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
            groups.map((e) => (
              <section key={e.id}>
                <h2 className="mb-2 text-lg font-semibold">{e.name}</h2>
                <div className="space-y-3">
                  {e.reading_types.map((t) => {
                    const id = `reading-${t.id}`
                    return (
                      <div key={t.id}>
                        <label htmlFor={id} className="block text-sm">
                          {readingTypeLabel(t.name, t.unit)}
                        </label>
                        <input
                          id={id}
                          type="text"
                          // "text", not "decimal": the iOS decimal keypad has no "<" or letter keys,
                          // and values such as "<1", "OL" and "N/A" are valid.
                          inputMode="text"
                          autoComplete="off"
                          value={values[t.id] ?? ''}
                          onChange={(ev) => setValues((v) => ({ ...v, [t.id]: ev.target.value }))}
                          className={`${inputClass} mt-1`}
                        />
                      </div>
                    )
                  })}
                </div>
              </section>
            ))
          )}

          <div className="flex justify-end gap-2 pb-6">
            <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving} className={primaryButtonClass}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
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
    </div>
  )
}
