import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { applyBrand, loadBrand } from './lib/brand'
import './index.css'

const root = document.getElementById('root') as HTMLElement

async function start() {
  try {
    const brand = loadBrand()
    applyBrand(brand)
    const { default: App } = await import('./App')
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>,
    )
  } catch (err) {
    // Startup misconfiguration (missing env var, unknown client): show it plainly instead of a blank page.
    const message = err instanceof Error ? err.message : String(err)
    root.textContent = `Configuration error: ${message}`
    root.style.padding = '16px'
    throw err
  }
}

void start()
