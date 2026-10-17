import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ChecklistItemDialog from '../components/ChecklistItemDialog'
import { inputClass, outlineOnDarkButtonClass } from '../components/Modal'
import PageBanner, { Badge } from '../components/PageBanner'
import RemoveChecklistDialog from '../components/RemoveChecklistDialog'
import { LoadError, SkeletonBlock } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { useSession } from '../lib/auth'
import { loadBrand } from '../lib/brand'
import { checklistFileName, checklistProgress, DEFICIENCIES_TITLE, groupChecklist } from '../lib/checklist'
import { buildChecklistPdf, type ChecklistPdfInput } from '../lib/checklistPdf'
import { formatDate, todayLocalIso } from '../lib/dates'
import {
  addChecklistItem,
  getChecklist,
  getSession,
  getSite,
  removeChecklistItem,
  removeChecklistSection,
  setChecklistDeficiencies,
  setChecklistItemChecked,
  setChecklistItemValue,
  startChecklist,
} from '../lib/db'
import type { ChecklistItem, ChecklistWithItems } from '../lib/db'
import { useLoad } from '../lib/useLoad'

async function loadChecklistPage(siteId: string, sessionId: string, isEditor: boolean) {
  const [site, session] = await Promise.all([getSite(siteId), getSession(sessionId)])
  if (!site || !session || session.site_id !== siteId) return null
  let checklist = await getChecklist(sessionId)
  // Only an editor starts a checklist. A logged-out visit never creates one.
  if (!checklist && isEditor) {
    await startChecklist(sessionId)
    checklist = await getChecklist(sessionId)
  }
  return { site, session, checklist }
}

/** The brand logo as a PNG data URL with its natural size, or null if it cannot be read (no logo then). */
async function loadLogo(): Promise<ChecklistPdfInput['logo']> {
  const url = loadBrand().logoUrl
  if (!url) return null
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const width = img.naturalWidth
    const height = img.naturalHeight
    if (!width || !height) return null
    // Draw small images (often SVGs) larger so the PDF logo stays sharp; the aspect ratio is unchanged.
    const scale = Math.max(1, 640 / Math.max(width, height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return { dataUrl: canvas.toDataURL('image/png'), width, height }
  } catch {
    return null
  }
}

/** Whether this browser can hand a PDF file to the share sheet (phones, mostly). */
function canShareFiles(): boolean {
  try {
    return !!navigator.canShare?.({ files: [new File([''], 'x.pdf', { type: 'application/pdf' })] })
  } catch {
    return false
  }
}

type Dialog =
  | { kind: 'addItem'; section: string }
  | { kind: 'addSection' }
  | { kind: 'removeItem'; item: ChecklistItem }
  | { kind: 'removeSection'; section: string; count: number }
  | null

const sectionCard = 'rounded-xl border border-gray-200 bg-white p-4 shadow-sm'
const sectionTitle = 'font-display text-lg font-semibold uppercase tracking-wide text-primary'
const groupTitle = 'mt-3 font-display text-sm font-semibold uppercase tracking-wide text-muted'
const smallButton = 'min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 text-sm'

export default function ChecklistPage() {
  const { siteId = '', sessionId = '' } = useParams()
  const { loading: authLoading, isEditor } = useSession()
  const [state, reload] = useLoad(() => loadChecklistPage(siteId, sessionId, isEditor), [siteId, sessionId, isEditor])
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [busy, setBusy] = useState(false)

  const data = state.status === 'ready' ? state.data : null
  const checklist = data?.checklist ?? null

  // Local copy of the items so ticks and values show at once; reseeded whenever the data reloads.
  // Seeded during render (not in an effect) so the inputs never mount with empty values.
  const [seededFrom, setSeededFrom] = useState<ChecklistWithItems | null>(null)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [deficiencies, setDeficiencies] = useState<string | null>(null)
  if (checklist !== seededFrom) {
    setSeededFrom(checklist)
    setItems(checklist?.items ?? [])
    setDeficiencies(checklist?.deficiencies ?? null)
  }

  const [pending, setPending] = useState(0)
  const [saved, setSaved] = useState(false)

  /** Runs one autosave. Errors show as a toast; returns whether the write succeeded. */
  async function autosave(write: () => Promise<void>): Promise<boolean> {
    setPending((n) => n + 1)
    try {
      await write()
      setSaved(true)
      return true
    } catch (err) {
      setSaved(false)
      toast.error(err instanceof Error ? err.message : String(err))
      return false
    } finally {
      setPending((n) => n - 1)
    }
  }

  /** Runs an add or remove, then toasts the outcome and refetches. */
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

  async function toggle(item: ChecklistItem, checked: boolean) {
    const setChecked = (value: boolean) =>
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, checked: value } : i)))
    setChecked(checked)
    const ok = await autosave(() => setChecklistItemChecked(item.id, checked))
    if (!ok) setChecked(!checked)
  }

  async function saveValue(item: ChecklistItem, text: string): Promise<boolean> {
    const ok = await autosave(() => setChecklistItemValue(item.id, text))
    if (ok) {
      const value = text.trim() === '' ? null : text.trim()
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, value } : i)))
    }
    return ok
  }

  async function saveDeficiencies(text: string): Promise<boolean> {
    if (!checklist) return false
    const ok = await autosave(() => setChecklistDeficiencies(checklist.id, text))
    if (ok) setDeficiencies(text.trim() === '' ? null : text.trim())
    return ok
  }

  const [shareable] = useState(canShareFiles)
  const [exporting, setExporting] = useState(false)

  /** Builds this checklist's PDF from what is on screen. The same file for viewers and editors. */
  async function makePdf(): Promise<{ blob: Blob; fileName: string } | null> {
    if (!data || !checklist) return null
    const brand = loadBrand()
    const blob = await buildChecklistPdf({
      companyName: brand.companyName,
      footerText: brand.footerText,
      logo: await loadLogo(),
      siteName: data.site.name,
      date: data.session.reading_date,
      technician: data.session.technician,
      sections: groupChecklist(items),
      deficiencies,
      generatedOn: todayLocalIso(),
    })
    return { blob, fileName: checklistFileName(data.site.name, data.session.reading_date) }
  }

  async function downloadPdf() {
    setExporting(true)
    try {
      const pdf = await makePdf()
      if (!pdf) return
      const url = URL.createObjectURL(pdf.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = pdf.fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Some browsers read the URL after click() returns, so revoke it a moment later.
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setExporting(false)
    }
  }

  async function sharePdf() {
    if (!data) return
    setExporting(true)
    try {
      const pdf = await makePdf()
      if (!pdf) return
      const file = new File([pdf.blob], pdf.fileName, { type: 'application/pdf' })
      await navigator.share({
        files: [file],
        title: `Checklist · ${data.site.name} · ${formatDate(data.session.reading_date)}`,
      })
    } catch (err) {
      // Closing the share sheet is not an error.
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        toast.error(err instanceof Error ? err.message : String(err))
      }
    } finally {
      setExporting(false)
    }
  }

  const editing = isEditor && checklist !== null
  const sections = groupChecklist(items)
  const progress = checklistProgress(items)

  const backToSites = (
    <Link to="/" className="inline-flex min-h-[44px] items-center text-sm underline">
      ← Back to sites
    </Link>
  )

  return (
    <div>
      {(state.status === 'loading' || authLoading) && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading checklist">
          <SkeletonBlock className="h-40" />
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-40" />
        </div>
      )}
      {!authLoading && state.status === 'error' && (
        <>
          {backToSites}
          <LoadError message={state.message} onRetry={reload} />
        </>
      )}
      {!authLoading && state.status === 'ready' && state.data === null && (
        <>
          {backToSites}
          <p className="mt-2 text-muted">Entry not found.</p>
        </>
      )}
      {!authLoading && data && (
        <div>
          <PageBanner
            eyebrow="Checklist"
            title={data.site.name}
            badges={
              <>
                <Badge>{formatDate(data.session.reading_date)}</Badge>
                {data.session.technician && <Badge>{`Inspector: ${data.session.technician}`}</Badge>}
                {checklist && <Badge gold>{`${progress.checked} of ${progress.total} checked`}</Badge>}
              </>
            }
            action={
              <>
                <Link to={`/sites/${data.site.id}`} className={outlineOnDarkButtonClass + ' inline-flex items-center'}>
                  ← Back to site
                </Link>
                {checklist && (
                  <button type="button" onClick={downloadPdf} disabled={exporting} className={outlineOnDarkButtonClass}>
                    {exporting ? 'Preparing…' : 'Download PDF'}
                  </button>
                )}
                {checklist && shareable && (
                  <button type="button" onClick={sharePdf} disabled={exporting} className={outlineOnDarkButtonClass}>
                    Share
                  </button>
                )}
              </>
            }
          />

          {editing && (
            <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-muted">
              {pending > 0 ? 'Saving…' : saved ? 'All changes saved' : ''}
            </p>
          )}

          {!checklist ? (
            <p className="mt-6 text-muted">No checklist was filled in for this entry.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {sections.map((section) => (
                <section key={section.name} className={sectionCard}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className={sectionTitle}>{`${section.number}. ${section.name}`}</h2>
                    {editing && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setDialog({ kind: 'addItem', section: section.name })}
                          className={smallButton}
                        >
                          + Add item
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDialog({
                              kind: 'removeSection',
                              section: section.name,
                              count: section.groups.reduce((n, g) => n + g.items.length, 0),
                            })
                          }
                          className={`${smallButton} text-danger`}
                        >
                          Remove section
                        </button>
                      </div>
                    )}
                  </div>
                  {section.groups.map((group) => (
                    <div key={group.name ?? ''}>
                      {group.name && <h3 className={groupTitle}>{group.name}</h3>}
                      <ul className="mt-1 divide-y divide-gray-100">
                        {group.items.map((item) => (
                          <li key={item.id} className="flex items-center gap-2">
                            <div className="min-w-0 flex-1">
                              {editing ? (
                                item.kind === 'check' ? (
                                  <label className="flex min-h-[44px] cursor-pointer items-center gap-3 py-1">
                                    <input
                                      type="checkbox"
                                      checked={item.checked}
                                      onChange={(e) => toggle(item, e.target.checked)}
                                      className="h-5 w-5 shrink-0 accent-primary"
                                    />
                                    <span>{item.label}</span>
                                  </label>
                                ) : (
                                  <ValueInput item={item} onSave={(text) => saveValue(item, text)} />
                                )
                              ) : (
                                <ReadOnlyItem item={item} />
                              )}
                            </div>
                            {editing && (
                              <button
                                type="button"
                                onClick={() => setDialog({ kind: 'removeItem', item })}
                                aria-label={`Remove ${item.label}`}
                                className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg text-xl text-muted hover:bg-gray-100"
                              >
                                ×
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
              ))}

              {editing && (
                <div>
                  <button type="button" onClick={() => setDialog({ kind: 'addSection' })} className={smallButton}>
                    + Add section
                  </button>
                </div>
              )}

              <section className={sectionCard}>
                <h2 className={sectionTitle}>{`${sections.length + 1}. ${DEFICIENCIES_TITLE}`}</h2>
                {editing ? (
                  <DeficienciesInput key={checklist.id} saved={deficiencies} onSave={saveDeficiencies} />
                ) : deficiencies ? (
                  <p className="mt-2 whitespace-pre-wrap">{deficiencies}</p>
                ) : (
                  <p className="mt-2 text-muted">None recorded.</p>
                )}
              </section>
            </div>
          )}
        </div>
      )}

      {editing && data && checklist && dialog && (
        <>
          {(dialog.kind === 'addItem' || dialog.kind === 'addSection') && (
            <ChecklistItemDialog
              mode={dialog.kind === 'addItem' ? { kind: 'item', section: dialog.section } : { kind: 'section' }}
              siteName={data.site.name}
              sections={sections.map((s) => ({
                name: s.name,
                groups: s.groups.flatMap((g) => (g.name ? [g.name] : [])),
              }))}
              busy={busy}
              onCancel={() => setDialog(null)}
              onSubmit={(v) =>
                run(async () => {
                  await addChecklistItem({ checklistId: checklist.id, siteId: data.site.id, ...v })
                  return dialog.kind === 'addSection' ? 'Section added' : 'Item added'
                })
              }
            />
          )}

          {dialog.kind === 'removeItem' && (
            <RemoveChecklistDialog
              target={{ kind: 'item', item: dialog.item }}
              siteName={data.site.name}
              busy={busy}
              onCancel={() => setDialog(null)}
              onConfirm={(alsoForSite) =>
                run(async () => {
                  await removeChecklistItem(dialog.item, alsoForSite)
                  return 'Item removed'
                })
              }
            />
          )}

          {dialog.kind === 'removeSection' && (
            <RemoveChecklistDialog
              target={{ kind: 'section', section: dialog.section, count: dialog.count }}
              siteName={data.site.name}
              busy={busy}
              onCancel={() => setDialog(null)}
              onConfirm={(alsoForSite) =>
                run(async () => {
                  await removeChecklistSection(checklist.id, data.site.id, dialog.section, alsoForSite)
                  return 'Section removed'
                })
              }
            />
          )}
        </>
      )}
    </div>
  )
}

/** A written-value item: saves on blur (Enter blurs) when the text differs from what is stored. */
function ValueInput({ item, onSave }: { item: ChecklistItem; onSave: (text: string) => Promise<boolean> }) {
  const [draft, setDraft] = useState(item.value ?? '')
  const id = `checklist-value-${item.id}`

  function commit() {
    // A failed save keeps the typed text, so the next blur compares against the stored value and retries.
    if (draft.trim() !== (item.value ?? '')) void onSave(draft)
  }

  return (
    <div className="flex min-h-[44px] flex-wrap items-center gap-x-3 gap-y-1 py-1">
      <label htmlFor={id} className="min-w-[6rem]">
        {item.label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="text"
          autoComplete="off"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          className={`${inputClass} w-40`}
        />
        {item.unit && <span className="text-sm text-muted">{item.unit}</span>}
      </div>
    </div>
  )
}

/** The Deficiencies / Corrective Actions box: saves on blur when changed. */
function DeficienciesInput({ saved, onSave }: { saved: string | null; onSave: (text: string) => Promise<boolean> }) {
  const [draft, setDraft] = useState(saved ?? '')
  return (
    <textarea
      aria-label={DEFICIENCIES_TITLE}
      rows={4}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft.trim() !== (saved ?? '')) void onSave(draft)
      }}
      className={`${inputClass} mt-2`}
    />
  )
}

/** Logged-out item: a tick or an empty box, or "Label: value unit". No inputs. */
function ReadOnlyItem({ item }: { item: ChecklistItem }) {
  if (item.kind === 'check') {
    return (
      <div className="flex min-h-[44px] items-center gap-3 py-1">
        <span
          role="img"
          aria-label={item.checked ? 'Checked' : 'Not checked'}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-sm font-bold ${
            item.checked ? 'border-success bg-success text-white' : 'border-gray-400 bg-white'
          }`}
        >
          {item.checked ? '✓' : ''}
        </span>
        <span>{item.label}</span>
      </div>
    )
  }
  return (
    <div className="flex min-h-[44px] items-center py-1">
      {item.value ? (
        <span>
          {item.label}: <span className="font-semibold">{item.value}</span>
          {item.unit ? ` ${item.unit}` : ''}
        </span>
      ) : (
        <span>
          {item.label}: <span className="text-muted">–</span>
        </span>
      )}
    </div>
  )
}
