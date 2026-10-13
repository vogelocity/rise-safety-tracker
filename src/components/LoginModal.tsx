import { useState, type FormEvent } from 'react'
import { login } from '../lib/auth'
import Modal, { inputClass, primaryButtonClass, secondaryButtonClass } from './Modal'
import { useToast } from './Toast'

/** Password only. The email comes from VITE_EDITOR_EMAIL. A wrong password shows Supabase's message and stays read-only. */
export default function LoginModal({ onClose }: { onClose: () => void }) {
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      await login(password)
      toast.success('Logged in. Editing is on.')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  return (
    <Modal title="Editor login" onClose={onClose}>
      <form onSubmit={submit}>
        <label className="block text-sm" htmlFor="editor-password">
          Password
        </label>
        <input
          id="editor-password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${inputClass} mt-1`}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" disabled={busy || password === ''} className={primaryButtonClass}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
