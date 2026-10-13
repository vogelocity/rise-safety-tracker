import { useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import FieldsDialog from '../components/FieldsDialog'
import { primaryButtonClass } from '../components/Modal'
import SiteCard from '../components/SiteCard'
import { LoadError, SkeletonBlock } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { useSession } from '../lib/auth'
import { downloadCsv, readingsToCsv } from '../lib/csv'
import { todayLocalIso } from '../lib/dates'
import { createSite, deleteSite, listAllReadingsForExport, listSiteSummaries, updateSite } from '../lib/db'
import type { SiteSummary } from '../lib/db'
import { useLoad } from '../lib/useLoad'

type Dialog = { kind: 'add' } | { kind: 'edit'; site: SiteSummary } | { kind: 'delete'; site: SiteSummary } | null

const SITE_FIELDS = [
  { name: 'name', label: 'Name', required: true },
  { name: 'site_type', label: 'Site type', placeholder: 'For example: Well pad, Tank battery' },
  { name: 'notes', label: 'Notes', multiline: true },
]

export default function SitesPage() {
  const [state, reload] = useLoad(listSiteSummaries, [])
  const { isEditor } = useSession()
  const toast = useToast()
  const [exporting, setExporting] = useState(false)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [busy, setBusy] = useState(false)

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

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Sites</h1>
        <div className="flex gap-2">
          {isEditor && (
            <button type="button" onClick={() => setDialog({ kind: 'add' })} className={primaryButtonClass}>
              + Add site
            </button>
          )}
          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting}
            className="min-h-[44px] rounded-lg border border-gray-200 bg-white px-4 text-sm disabled:opacity-60"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {state.status === 'loading' && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading sites">
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
        </div>
      )}
      {state.status === 'error' && <LoadError message={state.message} onRetry={reload} />}
      {state.status === 'ready' &&
        (state.data.length === 0 ? (
          <p className="text-muted">No sites yet.</p>
        ) : (
          <ul className="space-y-3">
            {state.data.map((s) => (
              <li key={s.id}>
                <SiteCard site={s} onEdit={isEditor ? () => setDialog({ kind: 'edit', site: s }) : undefined} />
              </li>
            ))}
          </ul>
        ))}

      {isEditor && dialog?.kind === 'add' && (
        <FieldsDialog
          title="Add site"
          fields={SITE_FIELDS}
          busy={busy}
          onCancel={() => setDialog(null)}
          onSubmit={(v) =>
            run(async () => {
              await createSite({ name: v.name, site_type: v.site_type, notes: v.notes })
              return 'Site added'
            })
          }
        />
      )}
      {isEditor && dialog?.kind === 'edit' && (
        <FieldsDialog
          title="Edit site"
          fields={SITE_FIELDS}
          initial={{
            name: dialog.site.name,
            site_type: dialog.site.site_type ?? '',
            notes: dialog.site.notes ?? '',
          }}
          busy={busy}
          onCancel={() => setDialog(null)}
          onDelete={{ label: 'Delete site', run: () => setDialog({ kind: 'delete', site: dialog.site }) }}
          onSubmit={(v) =>
            run(async () => {
              await updateSite(dialog.site.id, { name: v.name, site_type: v.site_type, notes: v.notes })
              return 'Site saved'
            })
          }
        />
      )}
      {isEditor && dialog?.kind === 'delete' && (
        <ConfirmDialog
          title="Delete site?"
          message={`Delete "${dialog.site.name}"? This deletes all equipment and readings for that site. This cannot be undone.`}
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
