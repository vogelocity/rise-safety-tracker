import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import EntriesTable from '../components/EntriesTable'
import EntryView from '../components/EntryView'
import EquipmentList, { readingTypeLabel } from '../components/EquipmentList'
import FieldsDialog from '../components/FieldsDialog'
import HistoryTable, { DEFAULT_SESSION_COUNT } from '../components/HistoryTable'
import LogReadingsForm from '../components/LogReadingsForm'
import Modal, { outlineOnDarkButtonClass, primaryButtonClass, secondaryButtonClass } from '../components/Modal'
import PageBanner, { Badge } from '../components/PageBanner'
import { LoadError, SkeletonBlock } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { useSession } from '../lib/auth'
import { formatDate } from '../lib/dates'
import { READING_TYPE_PRESETS } from '../lib/readingTypePresets'
import {
  copyReadingTypes,
  createEquipment,
  createReadingType,
  deleteEquipment,
  deleteReadingType,
  deleteSession,
  getSite,
  listEquipment,
  listReadings,
  listSessions,
  renameEquipment,
  updateReadingType,
} from '../lib/db'
import type { EquipmentWithTypes, ReadingSession, ReadingType } from '../lib/db'
import { useLoad } from '../lib/useLoad'

async function loadSiteDetail(siteId: string) {
  const site = await getSite(siteId)
  if (!site) return null
  const [equipment, sessions] = await Promise.all([listEquipment(siteId), listSessions(siteId)])
  // Only the default window of sessions is fetched up front. "Show all" needs the rest, so
  // fetch everything for sites with more sessions than the default (the table slices for display).
  const needed = sessions.length > DEFAULT_SESSION_COUNT ? sessions : sessions.slice(0, DEFAULT_SESSION_COUNT)
  const readings = await listReadings(needed.map((s) => s.id))
  return { site, equipment, sessions, readings }
}

type Tab = 'entries' | 'compare' | 'equipment'

type Dialog =
  | { kind: 'addEquipment' }
  | { kind: 'renameEquipment'; equipment: EquipmentWithTypes }
  | { kind: 'deleteEquipment'; equipment: EquipmentWithTypes }
  | { kind: 'addType'; equipment: EquipmentWithTypes }
  | { kind: 'editType'; equipment: EquipmentWithTypes; type: ReadingType }
  | { kind: 'deleteType'; equipment: EquipmentWithTypes; type: ReadingType }
  | { kind: 'copyTypes'; equipment: EquipmentWithTypes }
  | { kind: 'view'; session: ReadingSession }
  | { kind: 'log'; session: ReadingSession | null }
  | null

const TYPE_FIELDS = [
  { name: 'name', label: 'Name', required: true, placeholder: 'For example: Ohms' },
  { name: 'unit', label: 'Unit', placeholder: 'Optional' },
]

export default function SiteDetailPage() {
  const { siteId = '' } = useParams()
  const [state, reload] = useLoad(() => loadSiteDetail(siteId), [siteId])
  const { isEditor } = useSession()
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [tab, setTab] = useState<Tab>('entries')
  const [busy, setBusy] = useState(false)

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

  const data = state.status === 'ready' ? state.data : null
  const editing = isEditor && data !== null
  const logSession = dialog?.kind === 'log' ? dialog.session : null
  const hasReadingTypes = data ? data.equipment.some((e) => e.reading_types.length > 0) : false

  const sectionLabel = 'font-display text-xs font-semibold uppercase tracking-[0.15em] text-muted'
  const tabs: { key: Tab; label: string }[] = [
    { key: 'entries', label: 'Entries' },
    { key: 'compare', label: 'Compare' },
    { key: 'equipment', label: 'Equipment' },
  ]

  return (
    <div>
      {state.status === 'loading' && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading site">
          <SkeletonBlock className="h-40" />
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-40" />
        </div>
      )}
      {state.status === 'error' && (
        <>
          <Link to="/" className="inline-flex min-h-[44px] items-center text-sm underline">
            ← Back to sites
          </Link>
          <LoadError message={state.message} onRetry={reload} />
        </>
      )}
      {state.status === 'ready' && state.data === null && (
        <>
          <Link to="/" className="inline-flex min-h-[44px] items-center text-sm underline">
            ← Back to sites
          </Link>
          <p className="mt-2 text-muted">Site not found.</p>
        </>
      )}
      {data && (
        <div>
          <PageBanner
            eyebrow="Site"
            title={data.site.name}
            subtitle={data.site.notes ?? undefined}
            badges={
              <>
                {data.site.site_type && <Badge gold>{data.site.site_type}</Badge>}
                <Badge>{`${data.sessions.length} ${data.sessions.length === 1 ? 'entry' : 'entries'}`}</Badge>
                {data.sessions.length > 0 && (
                  <Badge>{`Last reading: ${formatDate(data.sessions[0].reading_date)}`}</Badge>
                )}
              </>
            }
            action={
              <Link to="/" className={outlineOnDarkButtonClass + ' inline-flex items-center'}>
                ← Back to sites
              </Link>
            }
          />

          <div role="tablist" className="mt-6 flex gap-2 border-b border-gray-200">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`min-h-[44px] px-3 font-display text-sm font-semibold uppercase tracking-wide ${
                  tab === t.key ? 'border-b-2 border-accent text-primary' : 'text-muted'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'entries' && (
            <section>
              <div className="mb-3 mt-4 flex items-center justify-between gap-3">
                <div className={sectionLabel}>Entries</div>
                {editing && (
                  <button
                    type="button"
                    onClick={() => setDialog({ kind: 'log', session: null })}
                    className={primaryButtonClass}
                  >
                    + New entry
                  </button>
                )}
              </div>
              {editing && !hasReadingTypes && (
                <p className="mb-3 text-muted">Add equipment and reading types first (Equipment tab).</p>
              )}
              <EntriesTable
                sessions={data.sessions}
                readings={data.readings}
                equipment={data.equipment}
                onOpen={(session) => setDialog(isEditor ? { kind: 'log', session } : { kind: 'view', session })}
              />
            </section>
          )}

          {tab === 'compare' && (
            <section>
              <div className={`mb-3 mt-4 ${sectionLabel}`}>Compare across dates</div>
              <HistoryTable equipment={data.equipment} sessions={data.sessions} readings={data.readings} />
            </section>
          )}

          {tab === 'equipment' && (
            <section>
              <div className="mb-3 mt-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className={sectionLabel}>Equipment</h2>
                {editing && (
                  <button
                    type="button"
                    onClick={() => setDialog({ kind: 'addEquipment' })}
                    className={primaryButtonClass}
                  >
                    + Add equipment
                  </button>
                )}
              </div>
              <EquipmentList
                equipment={data.equipment}
                actions={
                  editing
                    ? {
                        onRename: (equipment) => setDialog({ kind: 'renameEquipment', equipment }),
                        onDelete: (equipment) => setDialog({ kind: 'deleteEquipment', equipment }),
                        onAddType: (equipment) => setDialog({ kind: 'addType', equipment }),
                        onCopyTypes: (equipment) => setDialog({ kind: 'copyTypes', equipment }),
                        onEditType: (equipment, type) => setDialog({ kind: 'editType', equipment, type }),
                      }
                    : undefined
                }
              />
            </section>
          )}
        </div>
      )}

      {/* The read-only entry view is the only dialog a logged-out viewer can open. */}
      {data && dialog?.kind === 'view' && (
        <EntryView
          siteName={data.site.name}
          equipment={data.equipment}
          session={dialog.session}
          readings={data.readings}
          onClose={() => setDialog(null)}
        />
      )}

      {editing && data && dialog && (
        <>
          {dialog.kind === 'addEquipment' && (
            <FieldsDialog
              title="Add equipment"
              fields={[{ name: 'name', label: 'Name', required: true, placeholder: 'For example: Light Plant 1' }]}
              busy={busy}
              onCancel={() => setDialog(null)}
              onSubmit={(v) =>
                run(async () => {
                  await createEquipment(data.site.id, v.name)
                  return 'Equipment added'
                })
              }
            />
          )}

          {dialog.kind === 'renameEquipment' && (
            <FieldsDialog
              title="Rename equipment"
              fields={[{ name: 'name', label: 'Name', required: true }]}
              initial={{ name: dialog.equipment.name }}
              busy={busy}
              onCancel={() => setDialog(null)}
              onSubmit={(v) =>
                run(async () => {
                  await renameEquipment(dialog.equipment.id, v.name)
                  return 'Equipment renamed'
                })
              }
            />
          )}

          {dialog.kind === 'deleteEquipment' && (
            <ConfirmDialog
              title="Delete equipment?"
              message={`Delete "${dialog.equipment.name}"? This deletes its reading types and every reading recorded for it. This cannot be undone.`}
              confirmLabel="Delete equipment"
              danger
              busy={busy}
              onCancel={() => setDialog(null)}
              onConfirm={() =>
                run(async () => {
                  await deleteEquipment(dialog.equipment.id)
                  return 'Equipment deleted'
                })
              }
            />
          )}

          {dialog.kind === 'addType' && (
            <FieldsDialog
              title={`Add reading type to ${dialog.equipment.name}`}
              fields={TYPE_FIELDS}
              presets={READING_TYPE_PRESETS}
              busy={busy}
              onCancel={() => setDialog(null)}
              onSubmit={(v) =>
                run(async () => {
                  await createReadingType(dialog.equipment.id, v.name, v.unit)
                  return 'Reading type added'
                })
              }
            />
          )}

          {dialog.kind === 'editType' && (
            <FieldsDialog
              title="Edit reading type"
              fields={TYPE_FIELDS}
              presets={READING_TYPE_PRESETS}
              initial={{ name: dialog.type.name, unit: dialog.type.unit ?? '' }}
              busy={busy}
              onCancel={() => setDialog(null)}
              onDelete={{
                label: 'Delete',
                run: () => setDialog({ kind: 'deleteType', equipment: dialog.equipment, type: dialog.type }),
              }}
              onSubmit={(v) =>
                run(async () => {
                  await updateReadingType(dialog.type.id, v.name, v.unit)
                  return 'Reading type saved'
                })
              }
            />
          )}

          {dialog.kind === 'deleteType' && (
            <ConfirmDialog
              title="Delete reading type?"
              message={`Delete "${readingTypeLabel(dialog.type.name, dialog.type.unit)}" from ${dialog.equipment.name}? This deletes every reading recorded for it. This cannot be undone.`}
              confirmLabel="Delete reading type"
              danger
              busy={busy}
              onCancel={() => setDialog(null)}
              onConfirm={() =>
                run(async () => {
                  await deleteReadingType(dialog.type.id)
                  return 'Reading type deleted'
                })
              }
            />
          )}

          {dialog.kind === 'copyTypes' && (
            <CopyTypesDialog
              target={dialog.equipment}
              sources={data.equipment.filter((e) => e.id !== dialog.equipment.id && e.reading_types.length > 0)}
              busy={busy}
              onCancel={() => setDialog(null)}
              onPick={(source) =>
                run(async () => {
                  const added = await copyReadingTypes(source.id, dialog.equipment.id)
                  return added === 0
                    ? `${dialog.equipment.name} already has all of ${source.name}'s reading types`
                    : `Copied ${added} reading type${added === 1 ? '' : 's'} from ${source.name}`
                })
              }
            />
          )}

          {dialog.kind === 'log' && (
            <LogReadingsForm
              siteId={data.site.id}
              siteName={data.site.name}
              equipment={data.equipment}
              session={dialog.session}
              readings={data.readings}
              onClose={() => setDialog(null)}
              onSaved={reload}
              onDelete={logSession ? () => deleteSession(logSession.id) : undefined}
            />
          )}
        </>
      )}
    </div>
  )
}

/** Lists the site's other equipment that has reading types; tapping one copies its types onto `target`. */
function CopyTypesDialog({
  target,
  sources,
  busy,
  onPick,
  onCancel,
}: {
  target: EquipmentWithTypes
  sources: EquipmentWithTypes[]
  busy: boolean
  onPick: (source: EquipmentWithTypes) => void
  onCancel: () => void
}) {
  return (
    <Modal title={`Copy reading types to ${target.name}`} onClose={onCancel}>
      {sources.length === 0 ? (
        <p className="text-muted">No other equipment at this site has reading types yet.</p>
      ) : (
        <>
          <p className="mb-3 text-sm">Copy from:</p>
          <ul className="space-y-2">
            {sources.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onPick(s)}
                  className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-left disabled:opacity-60"
                >
                  <span className="block font-semibold">{s.name}</span>
                  <span className="block text-sm text-muted">
                    {s.reading_types.map((t) => readingTypeLabel(t.name, t.unit)).join(', ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={onCancel} disabled={busy} className={secondaryButtonClass}>
          Cancel
        </button>
      </div>
    </Modal>
  )
}
