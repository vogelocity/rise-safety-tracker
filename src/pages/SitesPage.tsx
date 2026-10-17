import { useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import FieldsDialog from '../components/FieldsDialog'
import { inputClass, outlineOnDarkButtonClass, primaryButtonClass } from '../components/Modal'
import PageBanner from '../components/PageBanner'
import { SITE_FIELDS, siteFormValues, siteInput } from '../components/siteFields'
import SitesTable from '../components/SitesTable'
import { LoadError, SkeletonBlock } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { useSession } from '../lib/auth'
import { downloadCsv, readingsToCsv } from '../lib/csv'
import { todayLocalIso } from '../lib/dates'
import { createSite, deleteSite, listAllReadingsForExport, listSiteSummaries, updateSite } from '../lib/db'
import type { SiteSummary } from '../lib/db'
import { useLoad } from '../lib/useLoad'

type Dialog = { kind: 'add' } | { kind: 'edit'; site: SiteSummary } | { kind: 'delete'; site: SiteSummary } | null

export default function SitesPage() {
  const [state, reload] = useLoad(listSiteSummaries, [])
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

  const allSites = state.status === 'ready' ? state.data : []
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
      {state.status !== 'loading' && (
        <PageBanner
          eyebrow="Site index"
          title="Sites"
          subtitle="Select a site to see its entries"
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
                  + Add site
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
      {state.status === 'ready' && (
        <>
          <div className="mb-3 mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-display text-xs font-semibold uppercase tracking-[0.15em] text-muted">All sites</div>
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
            emptyMessage={q ? `No sites match “${query.trim()}”.` : 'No sites yet.'}
            onEdit={isEditor ? (site) => setDialog({ kind: 'edit', site }) : undefined}
          />
        </>
      )}

      {isEditor && dialog?.kind === 'add' && (
        <FieldsDialog
          title="Add site"
          fields={SITE_FIELDS}
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
      {isEditor && dialog?.kind === 'edit' && (
        <FieldsDialog
          title="Edit site"
          fields={SITE_FIELDS}
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
    </div>
  )
}
