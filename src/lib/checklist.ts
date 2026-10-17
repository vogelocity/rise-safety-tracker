// Pure helpers for site checklists. No React or Supabase here, so the PDF sample script can use them in Node.

/** The fields of a checklist item these helpers need. ChecklistItem from db.ts satisfies it. */
export interface ChecklistItemLike {
  section: string
  group_name: string | null
  label: string
  kind: 'check' | 'value'
  unit: string | null
  checked: boolean
  value: string | null
  sort_order: number
}

export interface ChecklistGroup<T> {
  name: string | null
  items: T[]
}

export interface ChecklistSection<T> {
  name: string
  number: number
  groups: ChecklistGroup<T>[]
}

export const DEFICIENCIES_TITLE = 'Deficiencies / Corrective Actions'

export function checklistPath(siteId: string, sessionId: string): string {
  return `/sites/${siteId}/entries/${sessionId}/checklist`
}

/** Trimmed, case-insensitive name comparison. */
export function sameName(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase()
}

/**
 * Groups items into numbered sections. Sections are ordered by their first item, groups within a
 * section by their first item, and items by sort_order, so an item added with the highest sort_order
 * still shows at the end of its own group.
 */
export function groupChecklist<T extends ChecklistItemLike>(items: T[]): ChecklistSection<T>[] {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order)
  const sections: ChecklistSection<T>[] = []
  for (const item of sorted) {
    let section = sections.find((s) => s.name === item.section)
    if (!section) {
      section = { name: item.section, number: sections.length + 1, groups: [] }
      sections.push(section)
    }
    let group = section.groups.find((g) => g.name === item.group_name)
    if (!group) {
      group = { name: item.group_name, items: [] }
      section.groups.push(group)
    }
    group.items.push(item)
  }
  return sections
}

/** Ticked and total counts over checkbox items only. */
export function checklistProgress(items: ChecklistItemLike[]): { checked: number; total: number } {
  const checks = items.filter((i) => i.kind === 'check')
  return { checked: checks.filter((i) => i.checked).length, total: checks.length }
}

/** "Checklist - <site> - <YYYY-MM-DD>.pdf", with characters Windows forbids in file names replaced by "-". */
export function checklistFileName(siteName: string, isoDate: string): string {
  const safe = siteName.replace(/[\\/:*?"<>|]/g, '-')
  return `Checklist - ${safe} - ${isoDate}.pdf`
}
