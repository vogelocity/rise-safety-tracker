const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * "2026-09-12" -> "Sep 12, 2026". Built from the string parts on purpose:
 * new Date("2026-09-12") is parsed as UTC and can display as Sep 11 in Texas.
 */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  const month = MONTHS[Number(m[2]) - 1]
  if (!month) return iso
  return `${month} ${Number(m[3])}, ${m[1]}`
}

/** Today's date in the device's local time zone as YYYY-MM-DD (never toISOString, which is UTC). */
export function todayLocalIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
