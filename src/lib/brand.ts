export interface Brand {
  companyName: string
  appTitle: string
  logoFile?: string
  colors: { primary: string; accent: string; background: string; text: string }
  footerText: string
}

// Vite only bundles files it can see statically, so a dynamic import() would not work here.
const brands = import.meta.glob<Brand>('../../clients/*/brand.json', { eager: true, import: 'default' })
const logos = import.meta.glob<string>('../../clients/*/logo.*', { eager: true, query: '?url', import: 'default' })

export interface LoadedBrand extends Brand {
  logoUrl: string | null
}

let loaded: LoadedBrand | null = null

export function loadBrand(): LoadedBrand {
  if (loaded) return loaded

  const slug = import.meta.env.VITE_CLIENT as string | undefined
  if (!slug) {
    throw new Error('VITE_CLIENT is not set. Set it to a folder name under clients/ (see .env.example).')
  }

  const brandKey = Object.keys(brands).find((p) => p.includes(`/${slug}/`))
  if (!brandKey) {
    const available = Object.keys(brands)
      .map((p) => p.split('/').slice(-2, -1)[0])
      .join(', ')
    throw new Error(`No brand.json found for VITE_CLIENT="${slug}". Available clients: ${available || '(none)'}.`)
  }
  const brand = brands[brandKey]

  const clientLogos = Object.keys(logos).filter((p) => p.includes(`/${slug}/`))
  const logoKey =
    clientLogos.find((p) => brand.logoFile && p.endsWith(`/${brand.logoFile}`)) ?? clientLogos[0]
  const logoUrl = logoKey ? logos[logoKey] : null

  loaded = { ...brand, logoUrl }
  return loaded
}

/** Injects brand colors as CSS variables on :root. Call once before first render. */
export function applyBrand(brand: Brand): void {
  const root = document.documentElement.style
  root.setProperty('--color-primary', brand.colors.primary)
  root.setProperty('--color-accent', brand.colors.accent)
  root.setProperty('--color-background', brand.colors.background)
  root.setProperty('--color-text', brand.colors.text)
  document.title = `${brand.appTitle} · ${brand.companyName}`
}
