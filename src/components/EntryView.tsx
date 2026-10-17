import { Link } from 'react-router-dom'
import { checklistPath } from '../lib/checklist'
import type { EquipmentWithTypes, Reading, ReadingSession } from '../lib/db'
import { formatDate } from '../lib/dates'
import EntryPanel from './EntryPanel'
import { secondaryButtonClass } from './Modal'
import ReadingsSheet from './ReadingsSheet'

interface Props {
  siteName: string
  equipment: EquipmentWithTypes[]
  session: ReadingSession
  /** All readings for the site; filtered by session here. */
  readings: Reading[]
  onClose: () => void
}

/** Read-only entry: no inputs, no controls other than Back and View checklist. The only panel a logged-out viewer can open. */
export default function EntryView({ siteName, equipment, session, readings, onClose }: Props) {
  const values = new Map<string, string>()
  for (const r of readings) if (r.session_id === session.id) values.set(r.reading_type_id, r.value)
  const groups = equipment.filter((e) => e.reading_types.length > 0)

  return (
    <EntryPanel title="Entry" siteName={siteName} closeLabel="← Back" onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-sm text-muted">Date</div>
          <div className="font-semibold">{formatDate(session.reading_date)}</div>
        </div>
        <div>
          <div className="text-sm text-muted">Technician</div>
          <div className="font-semibold">{session.technician || '—'}</div>
        </div>
      </div>
      <Link
        to={checklistPath(session.site_id, session.id)}
        className={secondaryButtonClass + ' inline-flex items-center'}
      >
        View checklist →
      </Link>
      {session.notes && <p className="whitespace-pre-wrap">{session.notes}</p>}
      <ReadingsSheet
        equipment={groups}
        renderValue={(type) => {
          const value = values.get(type.id)
          return value === undefined ? <span className="text-muted">–</span> : <span className="font-semibold">{value}</span>
        }}
      />
    </EntryPanel>
  )
}
