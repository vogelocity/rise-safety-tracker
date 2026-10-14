import { useState } from 'react'
import type { EquipmentWithTypes, Reading, ReadingSession } from '../lib/db'
import { formatDate } from '../lib/dates'
import { DEFAULT_SESSION_COUNT } from './HistoryTable'

interface Props {
  /** Newest first, as listSessions returns them. */
  sessions: ReadingSession[]
  readings: Reading[]
  equipment: EquipmentWithTypes[]
  onOpen: (session: ReadingSession) => void
}

const cardClass = 'overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'

export default function EntriesTable({ sessions, readings, equipment, onOpen }: Props) {
  const [showAll, setShowAll] = useState(false)

  if (sessions.length === 0) {
    return (
      <div className={cardClass}>
        <p className="px-4 py-6 text-muted">No entries yet.</p>
      </div>
    )
  }

  const typeIds = new Set(equipment.flatMap((e) => e.reading_types.map((t) => t.id)))
  const total = typeIds.size
  const visible = showAll ? sessions : sessions.slice(0, DEFAULT_SESSION_COUNT)

  function badge(s: ReadingSession) {
    const filled = readings.filter((r) => r.session_id === s.id && typeIds.has(r.reading_type_id)).length
    if (total > 0 && filled === total) {
      return <span className="text-xs font-semibold text-success">✓ Complete</span>
    }
    return <span className="text-xs text-muted">{total === 0 ? `${filled} readings` : `${filled}/${total} readings`}</span>
  }

  return (
    <div>
      <div className={cardClass}>
        <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_44px] gap-3 bg-primary px-4 py-3 text-background sm:grid">
          <span className="font-display text-xs font-semibold uppercase tracking-[0.1em] text-accent">Date</span>
          <span className="font-display text-xs font-semibold uppercase tracking-[0.1em]">Technician</span>
          <span className="font-display text-xs font-semibold uppercase tracking-[0.1em]">Readings</span>
          <span />
        </div>
        <ul>
          {visible.map((s) => (
            <li key={s.id} className="border-b border-gray-200 last:border-b-0 odd:bg-white even:bg-gray-50">
              <button
                type="button"
                onClick={() => onOpen(s)}
                className="block min-h-[56px] w-full px-4 py-3 text-left"
              >
                <span className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_44px] items-center gap-3 sm:grid">
                  <span className="font-display text-base font-semibold text-primary">
                    {formatDate(s.reading_date)}
                  </span>
                  <span className="text-sm text-muted">{s.technician || '—'}</span>
                  {badge(s)}
                  <span className="text-right text-sm font-semibold text-primary">→</span>
                </span>
                <span className="block sm:hidden">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-base font-semibold text-primary">
                      {formatDate(s.reading_date)}
                    </span>
                    {badge(s)}
                    <span className="text-sm font-semibold text-primary">→</span>
                  </span>
                  <span className="mt-1 block text-sm text-muted">{s.technician || '—'}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
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
