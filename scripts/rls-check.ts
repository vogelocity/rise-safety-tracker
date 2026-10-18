// Verifies Row Level Security from the outside, the way the browser sees it.
// (The SQL editor runs as postgres and bypasses RLS, so it proves nothing.)
//
// Usage:  EDITOR_PASSWORD=... npm run rls-check
// Reads VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_EDITOR_EMAIL from .env.
// Uses only the publishable key. Never use the service_role / secret key.
import { createClient } from '@supabase/supabase-js'
import { CHECKLIST_DEFAULTS } from '../src/lib/checklistDefaults'
import { todayLocalIso } from '../src/lib/dates'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY
const email = process.env.VITE_EDITOR_EMAIL
const password = process.env.EDITOR_PASSWORD

if (!url || !key || !email || !password) {
  console.error('Missing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_EDITOR_EMAIL or EDITOR_PASSWORD.')
  process.exit(2)
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } }
const anon = createClient(url, key, opts)
const editor = createClient(url, key, opts)

let failures = 0
function check(label: string, ok: boolean, detail = '') {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`)
}

const testName = `rls-check ${new Date().toISOString()}`
let insertedId: string | null = null
let facilityId: string | null = null

try {
  // 1. Anon can read.
  const sel = await anon.from('sites').select('id, name').limit(5)
  check('anon select on sites succeeds', !sel.error, sel.error?.message ?? `${sel.data?.length ?? 0} row(s) visible`)

  // 2. Anon cannot write.
  const anonIns = await anon.from('sites').insert({ name: testName }).select()
  check(
    'anon insert on sites is rejected',
    !!anonIns.error,
    anonIns.error ? `${anonIns.status} ${anonIns.error.code}: ${anonIns.error.message}` : 'insert unexpectedly succeeded',
  )
  if (!anonIns.error && anonIns.data?.[0]) insertedId = anonIns.data[0].id // so cleanup still happens

  // 2b. Facilities: anon can read them but cannot write them.
  const facSel = await anon.from('facilities').select('id, name').limit(5)
  check(
    'anon select on facilities succeeds',
    !facSel.error,
    facSel.error?.message ?? `${facSel.data?.length ?? 0} row(s) visible`,
  )

  const anonFacIns = await anon.from('facilities').insert({ name: testName }).select()
  check(
    'anon insert on facilities is rejected',
    !!anonFacIns.error,
    anonFacIns.error
      ? `${anonFacIns.status} ${anonFacIns.error.code}: ${anonFacIns.error.message}`
      : 'insert unexpectedly succeeded',
  )
  if (!anonFacIns.error && anonFacIns.data?.[0]) facilityId = anonFacIns.data[0].id // so cleanup still happens

  // 3. Editor signs in.
  const signIn = await editor.auth.signInWithPassword({ email, password })
  check('editor signInWithPassword succeeds', !signIn.error, signIn.error?.message ?? email)
  if (signIn.error) throw new Error('Cannot continue without an editor session.')

  // 4. Editor can insert.
  const edIns = await editor.from('sites').insert({ name: testName }).select().single()
  check('editor insert on sites succeeds', !edIns.error, edIns.error?.message ?? `id ${edIns.data?.id}`)
  if (edIns.data) insertedId = edIns.data.id

  const edFacIns = await editor.from('facilities').insert({ name: testName }).select().single()
  check('editor insert on facilities succeeds', !edFacIns.error, edFacIns.error?.message ?? `id ${edFacIns.data?.id}`)
  if (edFacIns.data) facilityId = edFacIns.data.id

  if (insertedId) {
    // 5. Anon sees the editor's row.
    const seen = await anon.from('sites').select('id').eq('id', insertedId)
    check('anon can read the editor-created row', !seen.error && seen.data?.length === 1)

    // 6. Anon update/delete must change nothing (RLS filters to 0 rows rather than erroring).
    const upd = await anon.from('sites').update({ name: 'tampered' }).eq('id', insertedId).select()
    const del = await anon.from('sites').delete().eq('id', insertedId).select()
    const still = await editor.from('sites').select('name').eq('id', insertedId).single()
    check(
      'anon update and delete affect 0 rows',
      (upd.data?.length ?? 0) === 0 && (del.data?.length ?? 0) === 0 && still.data?.name === testName,
      still.error?.message,
    )

    // 7. Checklists: anon can read them but cannot write them or start one.
    const clSel = await anon.from('checklist_items').select('id').limit(5)
    check('anon select on checklist_items succeeds', !clSel.error, clSel.error?.message ?? `${clSel.data?.length ?? 0} row(s) visible`)

    const tplIns = await anon
      .from('site_checklist_items')
      .insert({ site_id: insertedId, section: 'rls-check', label: 'rls-check' })
      .select()
    check(
      'anon insert on site_checklist_items is rejected',
      !!tplIns.error,
      tplIns.error ? `${tplIns.status} ${tplIns.error.code}: ${tplIns.error.message}` : 'insert unexpectedly succeeded',
    )

    // The editor creates an entry for the test site; deleting the site at the end cascades it away.
    const sess = await editor
      .from('reading_sessions')
      .insert({ site_id: insertedId, reading_date: todayLocalIso() })
      .select('id')
      .single()
    if (sess.error) throw new Error(`Could not create a test entry: ${sess.error.message}`)
    const sessionId = (sess.data as { id: string }).id

    const anonStart = await anon.rpc('start_checklist', { p_session_id: sessionId, p_defaults: CHECKLIST_DEFAULTS })
    check(
      'anon start_checklist is rejected',
      !!anonStart.error,
      anonStart.error ? `${anonStart.status} ${anonStart.error.code}: ${anonStart.error.message}` : 'call unexpectedly succeeded',
    )

    // 8. The editor starts a checklist: the test site has no list yet, so it gets the standard one.
    const start1 = await editor.rpc('start_checklist', { p_session_id: sessionId, p_defaults: CHECKLIST_DEFAULTS })
    const count = start1.error
      ? null
      : await editor.from('checklist_items').select('id', { count: 'exact', head: true }).eq('checklist_id', start1.data)
    check(
      'editor start_checklist creates the standard checklist',
      !start1.error && !count?.error && count?.count === CHECKLIST_DEFAULTS.length,
      start1.error?.message ?? count?.error?.message ?? `${count?.count} of ${CHECKLIST_DEFAULTS.length} items`,
    )

    const start2 = await editor.rpc('start_checklist', { p_session_id: sessionId, p_defaults: CHECKLIST_DEFAULTS })
    check(
      'editor start_checklist again returns the same checklist',
      !start1.error && !start2.error && start2.data === start1.data,
      start2.error?.message,
    )

    // 9. A facility with a site cannot be deleted, not even by the editor (the foreign key is on delete restrict).
    if (facilityId) {
      const move = await editor.from('sites').update({ facility_id: facilityId }).eq('id', insertedId).select('id')
      if (move.error || move.data?.length !== 1) {
        throw new Error(`Could not put the test site in the test facility: ${move.error?.message ?? '0 rows changed'}`)
      }
      const facDel = await editor.from('facilities').delete().eq('id', facilityId).select()
      const kept = await editor.from('facilities').select('id').eq('id', facilityId)
      check(
        'editor delete of a facility with a site is rejected',
        facDel.error?.code === '23503' && kept.data?.length === 1,
        facDel.error ? `${facDel.status} ${facDel.error.code}: ${facDel.error.message}` : 'delete unexpectedly succeeded',
      )
    }

    // 10. Editor can delete (cleanup). Cascades to the test entry and its checklist.
    const edDel = await editor.from('sites').delete().eq('id', insertedId).select()
    check('editor delete on sites succeeds', !edDel.error && edDel.data?.length === 1, edDel.error?.message)
    if (!edDel.error) insertedId = null

    // 11. With its site gone, the test facility is empty and can be deleted (cleanup).
    if (facilityId && !insertedId) {
      const facDel = await editor.from('facilities').delete().eq('id', facilityId).select()
      check(
        'editor delete of an empty facility succeeds',
        !facDel.error && facDel.data?.length === 1,
        facDel.error?.message,
      )
      if (!facDel.error && facDel.data?.length === 1) facilityId = null
    }
  }
} catch (err) {
  failures++
  console.error('ERROR', err instanceof Error ? err.message : err)
} finally {
  if (insertedId) {
    const { error } = await editor.from('sites').delete().eq('id', insertedId)
    console.log(error ? `WARN  test row ${insertedId} NOT cleaned up: ${error.message}` : 'cleaned up leftover test row')
  }
  // After the site: the facility cannot be deleted while the test site is still in it.
  if (facilityId) {
    const { error } = await editor.from('facilities').delete().eq('id', facilityId)
    console.log(
      error ? `WARN  test facility ${facilityId} NOT cleaned up: ${error.message}` : 'cleaned up leftover test facility',
    )
  }
  // 'local' ends only this script's session. The default ('global') would also log out every phone and
  // browser signed in as the shared editor.
  await editor.auth.signOut({ scope: 'local' })
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
