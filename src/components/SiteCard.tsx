import { Link } from 'react-router-dom'
import type { SiteSummary } from '../lib/db'
import { formatDate } from '../lib/dates'

interface Props {
  site: SiteSummary
  /** Passed only in edit mode. When absent, no edit control is rendered. */
  onEdit?: () => void
}

export default function SiteCard({ site, onEdit }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <Link to={`/sites/${site.id}`} className="block min-h-[44px] p-4">
        <div className="text-lg font-semibold">{site.name}</div>
        {site.site_type && <div className="text-sm text-muted">{site.site_type}</div>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span>{site.last_reading_date ? `Last reading: ${formatDate(site.last_reading_date)}` : 'No readings yet'}</span>
          <span>Equipment: {site.equipment_count}</span>
        </div>
      </Link>
      {onEdit && (
        <div className="border-t border-gray-200 px-4 py-1">
          <button type="button" onClick={onEdit} className="min-h-[44px] pr-4 text-sm underline">
            Edit
          </button>
        </div>
      )}
    </div>
  )
}
