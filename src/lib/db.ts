// Every database query lives in this file. Components never call supabase directly.
// Supabase returns at most 1000 rows per request, so any query that can grow must use fetchAll().
import { supabase } from './supabase'

export interface Site {
  id: string
  name: string
  site_type: string | null
  notes: string | null
  sort_order: number
  created_at: string
}

export interface Equipment {
  id: string
  site_id: string
  name: string
  sort_order: number
  created_at: string
}

export interface ReadingType {
  id: string
  equipment_id: string
  name: string
  unit: string | null
  sort_order: number
  created_at: string
}

export interface ReadingSession {
  id: string
  site_id: string
  reading_date: string // ISO date, e.g. "2026-09-12"
  technician: string | null
  notes: string | null
  created_at: string
}

export interface Reading {
  id: string
  session_id: string
  reading_type_id: string
  value: string // text on purpose: "<1", "OL", "N/A" are valid
  created_at: string
}

export const PAGE_SIZE = 1000

/**
 * Pages through a query with .range() until a short page comes back.
 * `page(from, to)` must return a fresh query for that inclusive range.
 */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    const batch = data ?? []
    rows.push(...batch)
    if (batch.length < PAGE_SIZE) return rows
  }
}

// ---------------------------------------------------------------------------
// Read queries
// ---------------------------------------------------------------------------

export interface SiteSummary extends Site {
  equipment_count: number
  last_reading_date: string | null
}

export interface EquipmentWithTypes extends Equipment {
  reading_types: ReadingType[]
}

export interface ExportRow {
  site: string
  date: string
  technician: string
  equipment: string
  readingType: string
  unit: string
  value: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Sortable = { sort_order: number | null; name: string }
const bySortThenName = (a: Sortable, b: Sortable) =>
  (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name)

/** All sites with equipment count and most recent reading date, ordered by sort_order then name. */
export async function listSiteSummaries(): Promise<SiteSummary[]> {
  const [sites, equipment, sessions] = await Promise.all([
    fetchAll<Site>((from, to) => supabase.from('sites').select('*').order('id').range(from, to)),
    fetchAll<{ site_id: string }>((from, to) =>
      supabase.from('equipment').select('id, site_id').order('id').range(from, to),
    ),
    fetchAll<{ site_id: string; reading_date: string }>((from, to) =>
      supabase.from('reading_sessions').select('id, site_id, reading_date').order('id').range(from, to),
    ),
  ])

  const counts = new Map<string, number>()
  for (const e of equipment) counts.set(e.site_id, (counts.get(e.site_id) ?? 0) + 1)
  const latest = new Map<string, string>()
  for (const s of sessions) {
    // ISO dates sort correctly as strings.
    const current = latest.get(s.site_id)
    if (current === undefined || s.reading_date > current) latest.set(s.site_id, s.reading_date)
  }

  return sites
    .map((s) => ({ ...s, equipment_count: counts.get(s.id) ?? 0, last_reading_date: latest.get(s.id) ?? null }))
    .sort(bySortThenName)
}

/** One site, or null when it does not exist (including ids that are not valid UUIDs). */
export async function getSite(siteId: string): Promise<Site | null> {
  if (!UUID_RE.test(siteId)) return null
  const { data, error } = await supabase.from('sites').select('*').eq('id', siteId).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as Site | null) ?? null
}

/** Equipment at a site with its reading types, both in display order. */
export async function listEquipment(siteId: string): Promise<EquipmentWithTypes[]> {
  const rows = await fetchAll<Equipment & { reading_types: ReadingType[] | null }>((from, to) =>
    supabase.from('equipment').select('*, reading_types(*)').eq('site_id', siteId).order('id').range(from, to),
  )
  return rows
    .map((e) => ({ ...e, reading_types: [...(e.reading_types ?? [])].sort(bySortThenName) }))
    .sort(bySortThenName)
}

/** All sessions for a site, newest first. */
export async function listSessions(siteId: string): Promise<ReadingSession[]> {
  return fetchAll<ReadingSession>((from, to) =>
    supabase
      .from('reading_sessions')
      .select('*')
      .eq('site_id', siteId)
      .order('reading_date', { ascending: false })
      .order('id')
      .range(from, to),
  )
}

/** Readings for the given sessions. Ids are chunked so the request URL stays short. */
export async function listReadings(sessionIds: string[]): Promise<Reading[]> {
  const CHUNK = 50
  const out: Reading[] = []
  for (let i = 0; i < sessionIds.length; i += CHUNK) {
    const ids = sessionIds.slice(i, i + CHUNK)
    const rows = await fetchAll<Reading>((from, to) =>
      supabase.from('readings').select('*').in('session_id', ids).order('id').range(from, to),
    )
    out.push(...rows)
  }
  return out
}

interface ExportQueryRow {
  value: string
  reading_sessions: {
    reading_date: string
    technician: string | null
    sites: { name: string; sort_order: number | null } | null
  } | null
  reading_types: {
    name: string
    unit: string | null
    sort_order: number | null
    equipment: { name: string; sort_order: number | null } | null
  } | null
}

/** Every reading for every site, flattened for CSV: one row per reading. */
export async function listAllReadingsForExport(): Promise<ExportRow[]> {
  const rows = await fetchAll<ExportQueryRow>((from, to) =>
    supabase
      .from('readings')
      .select(
        'id, value, reading_sessions(reading_date, technician, sites(name, sort_order)), ' +
          'reading_types(name, unit, sort_order, equipment(name, sort_order))',
      )
      .order('id')
      .range(from, to)
      .returns<ExportQueryRow[]>(),
  )

  return rows
    .filter((r) => r.reading_sessions && r.reading_types)
    .map((r) => {
      const session = r.reading_sessions!
      const type = r.reading_types!
      return {
        row: {
          site: session.sites?.name ?? '',
          date: session.reading_date,
          technician: session.technician ?? '',
          equipment: type.equipment?.name ?? '',
          readingType: type.name,
          unit: type.unit ?? '',
          value: r.value,
        },
        siteOrder: session.sites?.sort_order ?? 0,
        equipOrder: type.equipment?.sort_order ?? 0,
        typeOrder: type.sort_order ?? 0,
      }
    })
    .sort(
      (a, b) =>
        a.siteOrder - b.siteOrder ||
        a.row.site.localeCompare(b.row.site) ||
        b.row.date.localeCompare(a.row.date) ||
        a.equipOrder - b.equipOrder ||
        a.row.equipment.localeCompare(b.row.equipment) ||
        a.typeOrder - b.typeOrder ||
        a.row.readingType.localeCompare(b.row.readingType),
    )
    .map((x) => x.row)
}

// ---------------------------------------------------------------------------
// Write queries (editor only; RLS rejects them for anon)
// ---------------------------------------------------------------------------

const blankToNull = (s: string): string | null => {
  const t = s.trim()
  return t === '' ? null : t
}

function requireName(name: string, what: string): string {
  const t = name.trim()
  if (t === '') throw new Error(`${what} name is required.`)
  return t
}

/**
 * RLS hides rows from a signed-out client instead of raising an error, so an update or delete can
 * "succeed" and change nothing. Treat zero affected rows as a failure so nothing fails silently.
 */
function expectRows(rows: unknown[] | null, what: string): void {
  if (!rows || rows.length === 0) {
    throw new Error(`${what} was not changed. You may be logged out, or it may already be gone.`)
  }
}

/** Next free sort_order within a table, optionally scoped to one parent. */
async function nextSortOrder(
  table: 'sites' | 'equipment' | 'reading_types',
  scope?: { column: 'site_id' | 'equipment_id'; value: string },
): Promise<number> {
  let query = supabase.from(table).select('sort_order').order('sort_order', { ascending: false }).limit(1)
  if (scope) query = query.eq(scope.column, scope.value)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  const top = (data?.[0] as { sort_order: number | null } | undefined)?.sort_order
  return (top ?? -1) + 1
}

export interface SiteInput {
  name: string
  site_type: string
  notes: string
}

export async function createSite(input: SiteInput): Promise<Site> {
  const sort_order = await nextSortOrder('sites')
  const { data, error } = await supabase
    .from('sites')
    .insert({
      name: requireName(input.name, 'Site'),
      site_type: blankToNull(input.site_type),
      notes: blankToNull(input.notes),
      sort_order,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Site
}

export async function updateSite(id: string, input: SiteInput): Promise<void> {
  const { data, error } = await supabase
    .from('sites')
    .update({
      name: requireName(input.name, 'Site'),
      site_type: blankToNull(input.site_type),
      notes: blankToNull(input.notes),
    })
    .eq('id', id)
    .select('id')
  if (error) throw new Error(error.message)
  expectRows(data, 'The site')
}

/** Cascades: removes the site's equipment, reading types, sessions and readings. */
export async function deleteSite(id: string): Promise<void> {
  const { data, error } = await supabase.from('sites').delete().eq('id', id).select('id')
  if (error) throw new Error(error.message)
  expectRows(data, 'The site')
}

export async function createEquipment(siteId: string, name: string): Promise<Equipment> {
  const sort_order = await nextSortOrder('equipment', { column: 'site_id', value: siteId })
  const { data, error } = await supabase
    .from('equipment')
    .insert({ site_id: siteId, name: requireName(name, 'Equipment'), sort_order })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Equipment
}

export async function renameEquipment(id: string, name: string): Promise<void> {
  const { data, error } = await supabase
    .from('equipment')
    .update({ name: requireName(name, 'Equipment') })
    .eq('id', id)
    .select('id')
  if (error) throw new Error(error.message)
  expectRows(data, 'The equipment')
}

/** Cascades: removes the equipment's reading types and every reading recorded against them. */
export async function deleteEquipment(id: string): Promise<void> {
  const { data, error } = await supabase.from('equipment').delete().eq('id', id).select('id')
  if (error) throw new Error(error.message)
  expectRows(data, 'The equipment')
}

export async function createReadingType(equipmentId: string, name: string, unit: string): Promise<ReadingType> {
  const sort_order = await nextSortOrder('reading_types', { column: 'equipment_id', value: equipmentId })
  const { data, error } = await supabase
    .from('reading_types')
    .insert({
      equipment_id: equipmentId,
      name: requireName(name, 'Reading type'),
      unit: blankToNull(unit),
      sort_order,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as ReadingType
}

export async function updateReadingType(id: string, name: string, unit: string): Promise<void> {
  const { data, error } = await supabase
    .from('reading_types')
    .update({ name: requireName(name, 'Reading type'), unit: blankToNull(unit) })
    .eq('id', id)
    .select('id')
  if (error) throw new Error(error.message)
  expectRows(data, 'The reading type')
}

/** Cascades: removes every reading recorded against this reading type. */
export async function deleteReadingType(id: string): Promise<void> {
  const { data, error } = await supabase.from('reading_types').delete().eq('id', id).select('id')
  if (error) throw new Error(error.message)
  expectRows(data, 'The reading type')
}

/**
 * Copies one piece of equipment's reading types onto another. A type whose name and unit already exist
 * on the target is skipped, so tapping twice does not create duplicates. Returns how many were added.
 */
export async function copyReadingTypes(fromEquipmentId: string, toEquipmentId: string): Promise<number> {
  const load = async (equipmentId: string) => {
    const { data, error } = await supabase.from('reading_types').select('*').eq('equipment_id', equipmentId)
    if (error) throw new Error(error.message)
    return ((data ?? []) as ReadingType[]).sort(bySortThenName)
  }
  const [source, target] = await Promise.all([load(fromEquipmentId), load(toEquipmentId)])
  const key = (t: { name: string; unit: string | null }) =>
    `${t.name.trim().toLowerCase()}|${(t.unit ?? '').trim().toLowerCase()}`
  const have = new Set(target.map(key))
  const toAdd = source.filter((t) => !have.has(key(t)))
  if (toAdd.length === 0) return 0

  const base = target.reduce((max, t) => Math.max(max, t.sort_order ?? 0), -1) + 1
  const { error } = await supabase
    .from('reading_types')
    .insert(toAdd.map((t, i) => ({ equipment_id: toEquipmentId, name: t.name, unit: t.unit, sort_order: base + i })))
  if (error) throw new Error(error.message)
  return toAdd.length
}

/** The session for a site and date, or null. */
export async function findSession(siteId: string, date: string): Promise<ReadingSession | null> {
  const { data, error } = await supabase
    .from('reading_sessions')
    .select('*')
    .eq('site_id', siteId)
    .eq('reading_date', date)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as ReadingSession | null) ?? null
}

export interface SaveSessionInput {
  siteId: string
  /** ISO date, YYYY-MM-DD. */
  date: string
  technician: string
  /** reading_type_id -> raw input text. Blank means "no reading". */
  values: Record<string, string>
  /**
   * True when the form was prefilled from this session: a blank input then deletes the row that was
   * there. False when the person never saw the existing values, so blanks are left alone.
   */
  deleteCleared: boolean
}

export interface SaveSessionResult {
  sessionId: string
  sessionCreated: boolean
  written: number
  deleted: number
}

/**
 * Writes one reading_session plus its readings. The session row is found or created for
 * (site_id, reading_date); readings are upserted on (session_id, reading_type_id). Values are stored
 * as typed (trimmed), never parsed: "<1", "OL" and "N/A" are valid.
 */
export async function saveSession(input: SaveSessionInput): Promise<SaveSessionResult> {
  const entries = Object.entries(input.values).map(([id, v]) => [id, v.trim()] as const)
  const filled = entries.filter(([, v]) => v !== '')
  if (filled.length === 0) throw new Error('Enter at least one reading.')
  const technician = blankToNull(input.technician)

  const existing = await findSession(input.siteId, input.date)
  let sessionId: string
  let sessionCreated = false
  if (existing) {
    sessionId = existing.id
    // Merging into a session the person has not seen must not erase its technician.
    if (technician !== null || input.deleteCleared) {
      const { data, error } = await supabase
        .from('reading_sessions')
        .update({ technician })
        .eq('id', sessionId)
        .select('id')
      if (error) throw new Error(error.message)
      expectRows(data, 'The session')
    }
  } else {
    const { data, error } = await supabase
      .from('reading_sessions')
      .insert({ site_id: input.siteId, reading_date: input.date, technician })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    sessionId = (data as { id: string }).id
    sessionCreated = true
  }

  try {
    const { error } = await supabase.from('readings').upsert(
      filled.map(([reading_type_id, value]) => ({ session_id: sessionId, reading_type_id, value })),
      { onConflict: 'session_id,reading_type_id' },
    )
    if (error) throw new Error(error.message)

    let deleted = 0
    if (input.deleteCleared) {
      const cleared = new Set(entries.filter(([, v]) => v === '').map(([id]) => id))
      if (cleared.size > 0) {
        const { data: current, error: readErr } = await supabase
          .from('readings')
          .select('id, reading_type_id')
          .eq('session_id', sessionId)
        if (readErr) throw new Error(readErr.message)
        const doomed = ((current ?? []) as { id: string; reading_type_id: string }[])
          .filter((r) => cleared.has(r.reading_type_id))
          .map((r) => r.id)
        if (doomed.length > 0) {
          const { error: delErr } = await supabase.from('readings').delete().in('id', doomed)
          if (delErr) throw new Error(delErr.message)
          deleted = doomed.length
        }
      }
    }
    return { sessionId, sessionCreated, written: filled.length, deleted }
  } catch (err) {
    // Do not leave an empty session behind when its readings failed to save.
    if (sessionCreated) await supabase.from('reading_sessions').delete().eq('id', sessionId)
    throw err
  }
}

/** Cascades: removes the session's readings. */
export async function deleteSession(id: string): Promise<void> {
  const { data, error } = await supabase.from('reading_sessions').delete().eq('id', id).select('id')
  if (error) throw new Error(error.message)
  expectRows(data, 'The session')
}
