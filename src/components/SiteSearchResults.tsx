import { Link } from 'react-router-dom'
import type { SiteIndexRow } from '../lib/db'

interface Props {
  /** Every matching site, in display order. Only the first MAX_ROWS are shown. */
  sites: SiteIndexRow[]
  /** Facility id to name. */
  facilityNames: Map<string, string>
  /** Shown when `sites` is empty. */
  emptyMessage: string
}

const MAX_ROWS = 50

const cardClass = 'overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'
const headLabelClass = 'font-display text-xs font-semibold uppercase tracking-[0.1em]'
const gridCols = 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_44px]'

/** The home page's site matches across every facility. Read-only: each row opens the site page. */
export default function SiteSearchResults({ sites, facilityNames, emptyMessage }: Props) {
  if (sites.length === 0) {
    return (
      <div className={cardClass}>
        <p className="px-4 py-6 text-muted">{emptyMessage}</p>
      </div>
    )
  }

  const shown = sites.slice(0, MAX_ROWS)
  return (
    <>
      <div className={cardClass}>
        <div className={`hidden ${gridCols} gap-3 bg-primary px-4 py-3 text-background sm:grid ${headLabelClass}`}>
          <span className="text-accent">Site</span>
          <span>Type</span>
          <span>Facility</span>
          <span />
        </div>
        <ul>
          {shown.map((site) => {
            const facility = site.facility_id ? facilityNames.get(site.facility_id) : undefined
            const facilityText = facility ?? 'No facility'
            const facilityClass = facility ? undefined : 'text-muted'
            return (
              <li key={site.id} className="border-b border-gray-200 last:border-b-0 odd:bg-white even:bg-gray-50">
                <Link to={`/sites/${site.id}`} className="block min-h-[56px] px-4 py-3">
                  <span className={`hidden ${gridCols} items-center gap-3 sm:grid`}>
                    <span className="font-semibold">{site.name}</span>
                    <span className="text-sm text-muted">{site.site_type ?? '—'}</span>
                    <span className={facilityClass}>{facilityText}</span>
                    <span className="text-right text-sm font-semibold text-primary">→</span>
                  </span>
                  <span className="block sm:hidden">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">{site.name}</span>
                      <span className="text-sm font-semibold text-primary">→</span>
                    </span>
                    <span className="mt-1 block text-sm text-muted">
                      {site.site_type ? `${site.site_type} · ` : ''}
                      {facilityText}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
      {sites.length > MAX_ROWS && (
        <p className="mt-2 text-sm text-muted">
          Showing {MAX_ROWS} of {sites.length}. Keep typing to narrow it down.
        </p>
      )}
    </>
  )
}
