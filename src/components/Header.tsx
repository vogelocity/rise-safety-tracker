import { useState } from 'react'
import { Link } from 'react-router-dom'
import { logout, useSession } from '../lib/auth'
import { loadBrand } from '../lib/brand'
import LoginModal from './LoginModal'
import { useToast } from './Toast'

export default function Header() {
  const brand = loadBrand()
  const { loading, isEditor } = useSession()
  const toast = useToast()
  const [loginOpen, setLoginOpen] = useState(false)

  async function handleLogout() {
    try {
      await logout()
      toast.success('Logged out')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const buttonClass =
    'ml-auto min-h-[44px] shrink-0 rounded-lg border border-white/35 px-3 text-sm font-semibold'

  return (
    <header className="sticky top-0 z-10 bg-primary text-background">
      <div className="mx-auto flex min-h-[56px] w-full max-w-[900px] items-center gap-3 px-4">
        <Link to="/" className="flex min-h-[44px] min-w-0 items-center gap-3">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.companyName} className="max-h-10" />
          ) : (
            <span className="font-semibold">{brand.companyName}</span>
          )}
          {/* With a logo, the title does not fit beside it and the login button on a phone, so it shows from sm: up. */}
          <span
            className={`truncate font-display text-lg font-bold uppercase tracking-wider ${brand.logoUrl ? 'hidden sm:inline' : ''}`}
          >
            {brand.appTitle}
          </span>
        </Link>
        {/* Nothing is rendered until the stored session has been read, so there is no flash of the wrong state. */}
        {!loading &&
          (isEditor ? (
            <button type="button" onClick={handleLogout} className={buttonClass}>
              Editing · Log out
            </button>
          ) : (
            <button type="button" onClick={() => setLoginOpen(true)} className={buttonClass}>
              Editor login
            </button>
          ))}
      </div>
      {loginOpen && !isEditor && <LoginModal onClose={() => setLoginOpen(false)} />}
    </header>
  )
}
