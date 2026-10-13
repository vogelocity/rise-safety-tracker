// Editor login. One shared Supabase Auth user per client; the email comes from VITE_EDITOR_EMAIL
// and the person types only the password. Supabase persists the session across refreshes.
import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const editorEmail = import.meta.env.VITE_EDITOR_EMAIL as string | undefined

/** Signs in as the shared editor. Throws an Error carrying Supabase's actual message on failure. */
export async function login(password: string): Promise<void> {
  if (!editorEmail) throw new Error('VITE_EDITOR_EMAIL is not set (see .env.example).')
  const { error } = await supabase.auth.signInWithPassword({ email: editorEmail, password })
  if (error) throw new Error(error.message)
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export interface SessionState {
  /** True until the stored session (if any) has been read. Edit controls stay unrendered while loading. */
  loading: boolean
  session: Session | null
  isEditor: boolean
}

export function useSession(): SessionState {
  const [state, setState] = useState<{ loading: boolean; session: Session | null }>({
    loading: true,
    session: null,
  })

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) setState({ loading: false, session: data.session })
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState({ loading: false, session })
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  return { loading: state.loading, session: state.session, isEditor: state.session !== null }
}
