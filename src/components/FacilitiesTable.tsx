import { Link } from 'react-router-dom'
import type { FacilitySummary } from '../lib/db'
import { siteCountLabel } from './facilityFields'

interface Props {
  facilities: FacilitySummary[]
  /** Edit mode only. When absent, no Edit control is rendered at all. */
  onEdit?: (facility: FacilitySummary) => void
  /** Sites with no facility. Above 0, a muted "No facility" row (without Edit) ends the table. */
  unassignedCount?: number
  /** Shown when there are no rows at all. Defaults to "No facilities yet." */
  emptyMessage?: string
}

const cardClass = 'overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'
const headLabelClass = 'font-display text-xs font-semibold uppercase tracking-[0.1em]'
const gridCols = 'grid-cols-[minmax(0,1fr)_120px_44px]'
const rowClass = 'flex items-stretch border-b border-gray-200 last:border-b-0 odd:bg-white even:bg-gray-50'
const linkClass = 'flex min-h-[56px] flex-1 items-center px-4 py-3'

/** One row's content: a grid on sm: and up, name and count on one line on phones. */
function RowContent({ name, count, muted }: { name: string; count: number; muted?: boolean }) {
  const nameClass = muted ? 'text-muted' : 'font-semibold'
  return (
    <>
      <span className={`hidden w-full ${gridCols} items-center gap-3 sm:grid`}>
        <span className={nameClass}>{name}</span>
        <span className={muted ? 'text-muted' : undefined}>{siteCountLabel(count)}</span>
        <span className="text-right text-sm font-semibold text-primary">→</span>
      </span>
      <span className="flex w-full items-baseline justify-between gap-2 sm:hidden">
        <span className={nameClass}>{name}</span>
        <span className="flex shrink-0 items-baseline gap-3">
          <span className="text-sm text-muted">{siteCountLabel(count)}</span>
          <span className="text-sm font-semibold text-primary">→</span>
        </span>
      </span>
    </>
  )
}

export default function FacilitiesTable({
  facilities,
  onEdit,
  unassignedCount = 0,
  emptyMessage = 'No facilities yet.',
}: Props) {
  if (facilities.length === 0 && unassignedCount === 0) {
    return (
      <div className={cardClass}>
        <p className="px-4 py-6 text-muted">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cardClass}>
      <div className="hidden bg-primary px-0 py-3 text-background sm:flex">
        <div className={`grid flex-1 ${gridCols} gap-3 px-4 ${headLabelClass}`}>
          <span className="text-accent">Facility</span>
          <span>Sites</span>
          <span />
        </div>
        {onEdit && <div className="w-[72px]" />}
      </div>
      <ul>
        {facilities.map((facility) => (
          <li key={facility.id} className={rowClass}>
            <Link to={`/facilities/${facility.id}`} className={linkClass}>
              <RowContent name={facility.name} count={facility.site_count} />
            </Link>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(facility)}
                className="min-h-[44px] w-[72px] text-sm underline"
              >
                Edit
              </button>
            )}
          </li>
        ))}
        {unassignedCount > 0 && (
          <li className={rowClass}>
            <Link to="/facilities/unassigned" className={linkClass}>
              <RowContent name="No facility" count={unassignedCount} muted />
            </Link>
            {onEdit && <div className="w-[72px]" />}
          </li>
        )}
      </ul>
    </div>
  )
}
