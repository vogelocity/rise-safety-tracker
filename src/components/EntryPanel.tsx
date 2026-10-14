import { useEffect, type ReactNode } from 'react'

interface Props {
  /** "New entry", "Edit entry" or "Entry". */
  title: string
  siteName: string
  /** "← Cancel" or "← Back". */
  closeLabel: string
  onClose: () => void
  /** The Save button; edit mode only. */
  primaryAction?: ReactNode
  children: ReactNode
}

/** Full-screen shell shared by the entry form and the read-only entry view. */
export default function EntryPanel({ title, siteName, closeLabel, onClose, primaryAction, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-background text-text" role="dialog" aria-modal="true" aria-label={title}>
      <div className="bg-primary text-background">
        <div className="mx-auto flex min-h-[56px] w-full max-w-[900px] items-center gap-3 px-4">
          <button type="button" onClick={onClose} className="min-h-[44px] text-sm underline">
            {closeLabel}
          </button>
          <div className="min-w-0 flex-1 truncate text-center font-display font-semibold uppercase tracking-wide">
            {title} · {siteName}
          </div>
          {primaryAction}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[900px] space-y-6 px-4 py-6">{children}</div>
      </div>
    </div>
  )
}
