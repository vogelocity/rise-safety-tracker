import { useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import FacilitiesTable from '../components/FacilitiesTable'
import { FACILITY_FIELDS, deleteFacilityMessage, facilityHasSitesMessage } from '../components/facilityFields'
import FieldsDialog from '../components/FieldsDialog'
import { inputClass, outlineOnDarkButtonClass, primaryButtonClass } from '../components/Modal'
import PageBanner from '../components/PageBanner'
import SiteSearchResults from '../components/SiteSearchResults'
import { LoadError, SkeletonBlock } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { useSession } from '../lib/auth'
import { downloadCsv, readingsToCsv } from '../lib/csv'
import { todayLocalIso } from '../lib/dates'
import { createFacility, deleteFacility, listAllReadingsForExport, listFacilityIndex, renameFacility } from '../lib/db'
import type { FacilitySummary } from '../lib/db'
import { useLoad } from '../lib/useLoad'

type Dialog =
  | { kind: 'add' }
  | { kind: 'edit'; facility: FacilitySummary }
  | { kind: 'delete'; facility: FacilitySummary }
  | null

const sectionLabel = 'font-display text-xs font-semibold uppercase tracking-[0.15em] text-muted'

/** The home page: every facility with its site count, and a search across facilities and sites. */
export default function FacilitiesPage() {
  const [state, reload] = useLoad(listFacilityIndex, [])
  const { isEditor } = useSession()
  const toast = useToast()
  const [exporting, setExporting] = useState(false)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')

  async function exportCsv() {
    setExporting(true)
    try {
      const rows = await listAllReadingsForExport()
      downloadCsv(`readings-${todayLocalIso()}.csv`, readingsToCsv(rows))
      toast.success(`Exported ${rows.length} reading${rows.length === 1 ? '' : 's'}`)
    } catch (err) {
      toast.error(`Export failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setExporting(false)
    }
  }

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

  /** A facility with sites cannot be deleted: say so and keep the edit dialog open. */
  function requestDelete(facility: FacilitySummary) {
    if (facility.site_count > 0) toast.error(facilityHasSitesMessage(facility.name, facility.site_count))
    else setDialog({ kind: 'delete', facility })
  }

  const index = state.status === 'ready' ? state.data : null
  const q = query.trim().toLowerCase()
  const matchingFacilities = index && q ? index.facilities.filter((f) => f.name.toLowerCase().includes(q)) : []
  const matchingSites =
    index && q
      ? index.sites.filter((s) => s.name.toLowerCase().includes(q) || (s.site_type ?? '').toLowerCase().includes(q))
      : []
  const facilityNames = new Map((index?.facilities ?? []).map((f) => [f.id, f.name]))
  const onEdit = isEditor ? (facility: FacilitySummary) => setDialog({ kind: 'edit', facility }) : undefined

  return (
    <div>
      {state.status === 'loading' && (
        <div className="space-y-6" aria-busy="true" aria-label="Loading facilities">
          <SkeletonBlock className="h-40" />
          <SkeletonBlock className="h-48" />
        </div>
      )}
      {state.status !== 'loading' && (
        <PageBanner
          eyebrow="Facility index"
          title="Facilities"
          subtitle="Select a facility to see its sites"
          action={
            <>
              <button
                type="button"
                onClick={exportCsv}
                disabled={exporting}
                className={outlineOnDarkButtonClass}
              >
                {exporting ? 'Exporting…' : 'Export CSV'}
              </button>
              {isEditor && (
                <button type="button" onClick={() => setDialog({ kind: 'add' })} className={primaryButtonClass}>
                  + Add facility
                </button>
              )}
            </>
          }
        />
      )}
      {state.status === 'error' && (
        <div className="mt-6">
          <LoadError message={state.message} onRetry={reload} />
        </div>
      )}
      {index && (
        <>
          <div className="mb-3 mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className={sectionLabel}>All facilities</div>
            {(index.facilities.length > 0 || index.sites.length > 0) && (
              <input
                type="search"
                inputMode="search"
                autoComplete="off"
                aria-label="Search facilities and sites"
                placeholder="Search facilities and sites"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`${inputClass} sm:w-64`}
              />
            )}
          </div>
          {q ? (
            <>
              <div className={`mb-3 ${sectionLabel}`}>Facilities</div>
              <FacilitiesTable
                facilities={matchingFacilities}
                emptyMessage={`No facilities match “${query.trim()}”.`}
                onEdit={onEdit}
              />
              <div className={`mb-3 mt-6 ${sectionLabel}`}>Sites</div>
              <SiteSearchResults
                sites={matchingSites}
                facilityNames={facilityNames}
                emptyMessage={`No sites match “${query.trim()}”.`}
              />
            </>
          ) : (
            <FacilitiesTable
              facilities={index.facilities}
              unassignedCount={index.unassigned_count}
              onEdit={onEdit}
            />
          )}
        </>
      )}

      {isEditor && dialog?.kind === 'add' && (
        <FieldsDialog
          title="Add facility"
          fields={FACILITY_FIELDS}
          busy={busy}
          onCancel={() => setDialog(null)}
          onSubmit={(v) =>
            run(async () => {
              await createFacility(v.name)
              return 'Facility added'
            })
          }
        />
      )}
      {isEditor && dialog?.kind === 'edit' && (
        <FieldsDialog
          title="Edit facility"
          fields={FACILITY_FIELDS}
          initial={{ name: dialog.facility.name }}
          busy={busy}
          onCancel={() => setDialog(null)}
          onDelete={{ label: 'Delete facility', run: () => requestDelete(dialog.facility) }}
          onSubmit={(v) =>
            run(async () => {
              await renameFacility(dialog.facility.id, v.name)
              return 'Facility saved'
            })
          }
        />
      )}
      {isEditor && dialog?.kind === 'delete' && (
        <ConfirmDialog
          title="Delete facility?"
          message={deleteFacilityMessage(dialog.facility.name)}
          confirmLabel="Delete facility"
          danger
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={() =>
            run(async () => {
              await deleteFacility(dialog.facility.id)
              return 'Facility deleted'
            })
          }
        />
      )}
    </div>
  )
}
