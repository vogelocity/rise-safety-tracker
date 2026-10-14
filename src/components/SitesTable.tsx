import { Link } from 'react-router-dom'
import type { SiteSummary } from '../lib/db'
import { formatDate } from '../lib/dates'

interface Props {
  sites: SiteSummary[]
  /** Edit mode only. When absent, no Edit control is rendered at all. */
  onEdit?: (site: SiteSummary) => void
}

const cardClass = 'overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'
const headLabelClass = 'font-display text-xs font-semibold uppercase tracking-[0.1em]'

const entriesLabel = (n: number) => `${n} ${n === 1 ? 'entry' : 'entries'}`

export default function SitesTable({ sites, onEdit }: Props) {
  if (sites.length === 0) {
    return (
      <div className={cardClass}>
        <p className="px-4 py-6 text-muted">No sites yet.</p>
      </div>
    )
  }

  return (
    <div className={cardClass}>
      <div className="hidden bg-primary px-0 py-3 text-background sm:flex">
        <div className={`grid flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_88px_44px] gap-3 px-4 ${headLabelClass}`}>
          <span className="text-accent">Site</span>
          <span>Type</span>
          <span>Last reading</span>
          <span>Entries</span>
          <span />
        </div>
        {onEdit && <div className="w-[72px]" />}
      </div>
      <ul>
        {sites.map((site) => (
          <li key={site.id} className="flex items-stretch border-b border-gray-200 last:border-b-0 odd:bg-white even:bg-gray-50">
            <Link to={`/sites/${site.id}`} className="block min-h-[56px] flex-1 px-4 py-3">
              <span className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_88px_44px] items-center gap-3 sm:grid">
                <span className="font-semibold">{site.name}</span>
                <span className="text-sm text-muted">{site.site_type ?? '—'}</span>
                <span>{site.last_reading_date ? formatDate(site.last_reading_date) : 'No readings yet'}</span>
                <span>{entriesLabel(site.session_count)}</span>
                <span className="text-right text-sm font-semibold text-primary">→</span>
              </span>
              <span className="block sm:hidden">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{site.name}</span>
                  {site.site_type && <span className="text-sm text-muted">{site.site_type}</span>}
                  <span className="text-sm font-semibold text-primary">→</span>
                </span>
                <span className="mt-1 block text-sm text-muted">
                  {site.last_reading_date ? `Last reading: ${formatDate(site.last_reading_date)}` : 'No readings yet'}
                  {' · '}
                  {entriesLabel(site.session_count)}
                </span>
              </span>
            </Link>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(site)}
                className="min-h-[44px] w-[72px] text-sm underline"
              >
                Edit
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
