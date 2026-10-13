import { loadBrand } from '../lib/brand'

export default function Footer() {
  const { footerText } = loadBrand()
  return <footer className="px-4 py-6 text-center text-sm text-muted">{footerText}</footer>
}
