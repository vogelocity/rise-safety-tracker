import { useEffect, type ReactNode } from 'react'

/** Centered dialog shell. Escape and the Cancel button close it; tapping the backdrop does not, so typed input is not lost. */
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-full w-full max-w-[420px] overflow-y-auto rounded-lg bg-white p-4 text-text shadow-lg"
      >
        <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-wide text-primary">{title}</h2>
        {children}
      </div>
    </div>
  )
}

export const inputClass =
  'min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-text focus:border-accent focus:outline-none'
export const primaryButtonClass =
  'min-h-[44px] rounded-lg bg-accent px-4 text-sm font-semibold text-primary hover:brightness-95 disabled:opacity-60'
export const secondaryButtonClass =
  'min-h-[44px] rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-text disabled:opacity-60'
export const dangerButtonClass =
  'min-h-[44px] rounded-lg bg-danger px-4 text-sm font-semibold text-white disabled:opacity-60'
export const outlineOnDarkButtonClass =
  'min-h-[44px] rounded-lg border border-white/35 bg-transparent px-4 text-sm font-semibold text-background disabled:opacity-60'
