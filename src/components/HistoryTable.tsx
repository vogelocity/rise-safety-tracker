import { useState } from 'react'
import type { EquipmentWithTypes, Reading, ReadingSession } from '../lib/db'
import { formatDate } from '../lib/dates'
import { readingTypeLabel } from './EquipmentList'

export const DEFAULT_SESSION_COUNT = 10

interface Props {
  equipment: EquipmentWithTypes[]
  /** Newest first. */
  sessions: ReadingSession[]
  readings: Reading[]
}

/**
 * Rows are reading types grouped by equipment; columns are session dates, newest on the left.
 * Cell values are shown exactly as stored (text), never parsed as numbers.
 */
export default function HistoryTable({ equipment, sessions, readings }: Props) {
  const [showAll, setShowAll] = useState(false)

  if (sessions.length === 0) return <p className="text-muted">No readings logged yet.</p>

  const visible = showAll ? sessions : sessions.slice(0, DEFAULT_SESSION_COUNT)
  const values = new Map<string, string>()
  for (const r of readings) values.set(`${r.session_id}:${r.reading_type_id}`, r.value)
  const groups = equipment.filter((e) => e.reading_types.length > 0)

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-[1] min-w-[150px] border-b border-gray-200 bg-primary px-3 py-2 text-left font-display text-xs font-semibold uppercase tracking-[0.1em] text-accent"
              >
                Equipment
              </th>
              {visible.map((s) => (
                <th
                  key={s.id}
                  scope="col"
                  className="min-w-[110px] whitespace-nowrap border-b border-gray-200 bg-primary px-3 py-2 text-left font-display text-xs font-semibold uppercase tracking-[0.1em] text-background"
                >
                  <div>{formatDate(s.reading_date)}</div>
                  {s.technician && <div className="text-xs font-normal opacity-70">{s.technician}</div>}
                </th>
              ))}
            </tr>
          </thead>
          {groups.map((e) => (
            <tbody key={e.id}>
              <tr>
                <th
                  scope="rowgroup"
                  className="sticky left-0 z-[1] border-b border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold"
                >
                  {e.name}
                </th>
                <td colSpan={visible.length} className="border-b border-gray-200 bg-gray-50" />
              </tr>
              {e.reading_types.map((t) => (
                <tr key={t.id}>
                  <th
                    scope="row"
                    className="sticky left-0 z-[1] border-b border-gray-200 bg-white px-3 py-2 text-left font-normal"
                  >
                    {readingTypeLabel(t.name, t.unit)}
                  </th>
                  {visible.map((s) => (
                    <td key={s.id} className="whitespace-nowrap border-b border-gray-200 px-3 py-2">
                      {values.get(`${s.id}:${t.id}`) ?? <span className="text-muted">–</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      {sessions.length > DEFAULT_SESSION_COUNT && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 min-h-[44px] rounded-lg border border-gray-200 bg-white px-4 text-sm"
        >
          {showAll ? `Show latest ${DEFAULT_SESSION_COUNT}` : `Show all (${sessions.length})`}
        </button>
      )}
    </div>
  )
}
