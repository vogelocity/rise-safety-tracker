import type { ReactNode } from 'react'

interface Props {
  /** Small label above the title, e.g. "Site index". */
  eyebrow: string
  title: string
  subtitle?: string
  badges?: ReactNode
  /** Buttons: right of the text on sm: and up, under it on phones. */
  action?: ReactNode
}

export default function PageBanner({ eyebrow, title, subtitle, badges, action }: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-primary bg-gradient-to-br from-transparent to-white/15 px-5 py-6 text-background sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="mb-3 h-[3px] w-12 rounded bg-accent" />
        <div className="font-display text-xs font-semibold uppercase tracking-[0.15em] opacity-60">{eyebrow}</div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">{title}</h1>
        {subtitle && <p className="mt-1 whitespace-pre-wrap text-sm opacity-70">{subtitle}</p>}
        {badges && <div className="mt-3 flex flex-wrap gap-2">{badges}</div>}
      </div>
      {action && <div className="flex flex-wrap gap-2 sm:shrink-0">{action}</div>}
    </div>
  )
}

const badgeBase = 'rounded-full border px-3 py-1 text-xs font-medium'

/** Pill badge for use inside the banner's `badges` slot. */
export function Badge({ children, gold }: { children: ReactNode; gold?: boolean }) {
  return (
    <span
      className={`${badgeBase} ${gold ? 'border-accent bg-white/10 text-accent' : 'border-white/20 bg-white/10'}`}
    >
      {children}
    </span>
  )
}
