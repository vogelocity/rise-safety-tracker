import Modal, { dangerButtonClass, primaryButtonClass, secondaryButtonClass } from './Modal'

interface Props {
  title: string
  message: string
  confirmLabel: string
  /** Styles the confirm button as destructive. */
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ title, message, confirmLabel, danger, busy, onConfirm, onCancel }: Props) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="whitespace-pre-wrap">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={busy} className={secondaryButtonClass}>
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={danger ? dangerButtonClass : primaryButtonClass}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
