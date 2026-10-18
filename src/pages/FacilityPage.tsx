import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import { FACILITY_FIELDS, deleteFacilityMessage, facilityHasSitesMessage, siteCountLabel } from '../components/facilityFields'
import FieldsDialog from '../components/FieldsDialog'
import { inputClass, outlineOnDarkButtonClass, primaryButtonClass } from '../components/Modal'
import PageBanner from '../components/PageBanner'
import { siteFields, siteFormValues, siteInput } from '../components/siteFields'
import SitesTable from '../components/SitesTable'
import { LoadError, SkeletonBlock } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { useSession } from '../lib/auth'
import {
  createSite,
  deleteFacility,
  deleteSite,
  getFacility,
  listFacilities,
  listSiteSummaries,
  renameFacility,
  updateSite,
} from '../lib/db'
import type { SiteSummary } from '../lib/db'
import { useLoad } from '../lib/useLoad'

/** The facility id in the URL of the page that lists sites with no facility. */
const UNASSIGNED = 'unassigned'

/** The facility (null for the "No facility" page), its sites, and every facility for the site dialog. */
async function loadFacilityPage(facilityId: string) {
  if (facilityId === UNASSIGNED) {
    const [sites, facilities] = await Promise.all([listSiteSummaries(null), listFacilities()])
    return { facility: null, sites, facilities }
  }
  const facility = await getFacility(facilityId)
  if (!facility) return null
  const [sites, facilities] = await Promise.all([listSiteSummaries(facility.id), listFacilities()])
  return { facility, sites, facilities }
}

type Dialog =
  | { kind: 'add' }
  | { kind: 'edit'; site: SiteSummary }
  | { kind: 'delete'; site: SiteSummary }
  | { kind: 'editFacility' }
  | { kind: 'deleteFacility' }
  | null

const backToFacilities = (
  <Link to="/" className="inline-flex min-h-[44px] items-center text-sm underline">
    ← Back to facilities
  </Link>
)

/** One facility's sites, or (at /facilities/unassigned) the sites that are not in a facility yet. */
export default function FacilityPage() {
  const { facilityId = '' } = useParams()
  const [state, reload] = useLoad(() => loadFacilityPage(facilityId), [facilityId])
  const { isEditor } = useSession()
  const toast = useToast()
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')

  /** Runs a write, then toasts the outcome (the real error message on failure) and refetches. */
  async function run(action: () => Promise<string>) {
    setBusy(true)
    try {
      toast.success(await action())
      setDialog(null)
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  /** Deletes the facility, then leaves the page, since it no longer exists. */
  async function removeFacility(facilityId: string) {
    setBusy(true)
    try {
      await deleteFacility(facilityId)
      toast.success('Facility deleted')
      navigate('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const data = state.status === 'ready' ? state.data : null
  const facility = data?.facility ?? null
  const allSites = data?.sites ?? []
  const q = query.trim().toLowerCase()
  const visibleSites = q
    ? allSites.filter((s) => s.name.toLowerCase().includes(q) || (s.site_type ?? '').toLowerCase().includes(q))
    : allSites

  return (
    <div>
      {state.status === 'loading' && (
        <div className="space-y-6" aria-busy="true" aria-label="Loading sites">
          <SkeletonBlock className="h-40" />
          <SkeletonBlock className="h-48" />
        </div>
      )}
      {state.status === 'error' && (
        <>
          {backToFacilities}
          <LoadError message={state.message} onRetry={reload} />
        </>
      )}
      {state.status === 'ready' && state.data === null && (
        <>
          {backToFacilities}
          <p className="mt-2 text-muted">Facility not found.</p>
        </>
      )}
      {data && (
        <>
          <PageBanner
            eyebrow="Facility"
            title={facility ? facility.name : 'No facility'}
            subtitle={
              facility
                ? siteCountLabel(allSites.length)
                : 'Sites that are not in a facility yet. Use Edit to move each one into a facility.'
            }
            action={
              <>
                <Link to="/" className={outlineOnDarkButtonClass + ' inline-flex items-center'}>
                  ← Back to facilities
                </Link>
                {isEditor && facility && (
                  <>
                    <button
                      type="button"
                      onClick={() => setDialog({ kind: 'editFacility' })}
                      className={outlineOnDarkButtonClass}
                    >
                      Edit facility
                    </button>
                    <button type="button" onClick={() => setDialog({ kind: 'add' })} className={primaryButtonClass}>
                      + Add site
                    </button>
                  </>
                )}
              </>
            }
          />
          <div className="mb-3 mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-display text-xs font-semibold uppercase tracking-[0.15em] text-muted">
              {facility ? `Sites at ${facility.name}` : 'Sites with no facility'}
            </div>
            {allSites.length > 0 && (
              <input
                type="search"
                inputMode="search"
                autoComplete="off"
                aria-label="Search sites"
                placeholder="Search sites"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`${inputClass} sm:w-64`}
              />
            )}
          </div>
          <SitesTable
            sites={visibleSites}
            emptyMessage={
              q ? `No sites match “${query.trim()}”.` : facility ? 'No sites yet.' : 'Every site is in a facility.'
            }
            onEdit={isEditor ? (site) => setDialog({ kind: 'edit', site }) : undefined}
          />
        </>
      )}

      {isEditor && data && dialog?.kind === 'add' && (
        <FieldsDialog
          title="Add site"
          fields={siteFields(data.facilities)}
          initial={{ facility_id: facility?.id ?? '' }}
          busy={busy}
          onCancel={() => setDialog(null)}
          onSubmit={(v) =>
            run(async () => {
              await createSite(siteInput(v))
              return 'Site added'
            })
          }
        />
      )}
      {isEditor && data && dialog?.kind === 'edit' && (
        <FieldsDialog
          title="Edit site"
          fields={siteFields(data.facilities)}
          initial={siteFormValues(dialog.site)}
          busy={busy}
          onCancel={() => setDialog(null)}
          onDelete={{ label: 'Delete site', run: () => setDialog({ kind: 'delete', site: dialog.site }) }}
          onSubmit={(v) =>
            run(async () => {
              await updateSite(dialog.site.id, siteInput(v))
              return 'Site saved'
            })
          }
        />
      )}
      {isEditor && dialog?.kind === 'delete' && (
        <ConfirmDialog
          title="Delete site?"
          message={`Delete "${dialog.site.name}"? This deletes all equipment, readings and checklists for that site. This cannot be undone.`}
          confirmLabel="Delete site"
          danger
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={() =>
            run(async () => {
              await deleteSite(dialog.site.id)
              return 'Site deleted'
            })
          }
        />
      )}
      {isEditor && facility && dialog?.kind === 'editFacility' && (
        <FieldsDialog
          title="Edit facility"
          fields={FACILITY_FIELDS}
          initial={{ name: facility.name }}
          busy={busy}
          onCancel={() => setDialog(null)}
          onDelete={{
            label: 'Delete facility',
            // A facility with sites cannot be deleted: say so and keep the edit dialog open.
            run: () =>
              allSites.length > 0
                ? toast.error(facilityHasSitesMessage(facility.name, allSites.length))
                : setDialog({ kind: 'deleteFacility' }),
          }}
          onSubmit={(v) =>
            run(async () => {
              await renameFacility(facility.id, v.name)
              return 'Facility saved'
            })
          }
        />
      )}
      {isEditor && facility && dialog?.kind === 'deleteFacility' && (
        <ConfirmDialog
          title="Delete facility?"
          message={deleteFacilityMessage(facility.name)}
          confirmLabel="Delete facility"
          danger
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={() => removeFacility(facility.id)}
        />
      )}
    </div>
  )
}
