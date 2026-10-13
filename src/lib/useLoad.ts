import { useCallback, useEffect, useRef, useState } from 'react'

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T }

/**
 * Runs an async loader on mount and whenever `deps` change. Ignores results from stale runs.
 * `reload` refetches without swapping the page for a skeleton, so open dialogs and scroll position survive.
 */
export function useLoad<T>(loader: () => Promise<T>, deps: unknown[]): [LoadState<T>, () => void] {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const quiet = useRef(false)

  useEffect(() => {
    let cancelled = false
    const keepData = quiet.current
    quiet.current = false
    setState((s) => (keepData && s.status === 'ready' ? s : { status: 'loading' }))
    loader().then(
      (data) => {
        if (!cancelled) setState({ status: 'ready', data })
      },
      (err: unknown) => {
        if (!cancelled) setState({ status: 'error', message: err instanceof Error ? err.message : String(err) })
      },
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  const reload = useCallback(() => {
    quiet.current = true
    setAttempt((n) => n + 1)
  }, [])
  return [state, reload]
}
