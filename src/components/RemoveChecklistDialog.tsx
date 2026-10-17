import { useState } from 'react'
import type { ChecklistItem } from '../lib/db'
import Modal, { dangerButtonClass, secondaryButtonClass } from './Modal'

interface Props {
  target: { kind: 'item'; item: ChecklistItem } | { kind: 'section'; section: string; count: number }
  siteName: string
  busy: boolean
  onConfirm: (alsoForSite: boolean) => void
  onCancel: () => void
}

/** Confirms removing a checklist item or section, optionally from the site's future checklists too. */
export default function RemoveChecklistDialog({ target, siteName, busy, onConfirm, onCancel }: Props) {
  const [alsoForSite, setAlsoForSite] = useState(true)
  const isItem = target.kind === 'item'
  // An item added only to this checklist has no site copy, so there is nothing else to remove.
  const showFuture = !isItem || target.item.template_item_id !== null
  const message = isItem
    ? `Remove "${target.item.label}" from this checklist?`
    : `Remove "${target.section}" and its ${target.count} ${target.count === 1 ? 'item' : 'items'} from this checklist?`

  return (
    <Modal title={isItem ? 'Remove item?' : 'Remove section?'} onClose={onCancel}>
      <p className="whitespace-pre-wrap">{message}</p>
      {showFuture && (
        <label className="mt-3 flex min-h-[44px] items-center gap-3">
          <input
            type="checkbox"
            checked={alsoForSite}
            onChange={(e) => setAlsoForSite(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-primary"
          />
          <span>Also remove it from future checklists at {siteName}</span>
        </label>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={busy} className={secondaryButtonClass}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(showFuture && alsoForSite)}
          disabled={busy}
          className={dangerButtonClass}
        >
          {busy ? 'Working…' : isItem ? 'Remove item' : 'Remove section'}
        </button>
      </div>
    </Modal>
  )
}
