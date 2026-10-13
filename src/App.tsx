import { Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import { ToastProvider } from './components/Toast'
import SitesPage from './pages/SitesPage'
import SiteDetailPage from './pages/SiteDetailPage'

export default function App() {
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-[900px] flex-1 px-4 py-6">
          <Routes>
            <Route path="/" element={<SitesPage />} />
            <Route path="/sites/:siteId" element={<SiteDetailPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </ToastProvider>
  )
}
