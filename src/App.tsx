import { Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import { ToastProvider } from './components/Toast'
import FacilitiesPage from './pages/FacilitiesPage'
import FacilityPage from './pages/FacilityPage'
import SiteDetailPage from './pages/SiteDetailPage'
import ChecklistPage from './pages/ChecklistPage'

export default function App() {
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-[900px] flex-1 px-4 py-6">
          <Routes>
            <Route path="/" element={<FacilitiesPage />} />
            <Route path="/facilities/:facilityId" element={<FacilityPage />} />
            <Route path="/sites/:siteId" element={<SiteDetailPage />} />
            <Route path="/sites/:siteId/entries/:sessionId/checklist" element={<ChecklistPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </ToastProvider>
  )
}
