import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import BrandsPage from './pages/BrandsPage'
import BrandFormPage from './pages/BrandFormPage'
import NewCampaignPage from './pages/NewCampaignPage'
import CampaignPage from './pages/CampaignPage'
import HistoryPage from './pages/HistoryPage'
import AnnotatePage from './pages/AnnotatePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="brands" element={<BrandsPage />} />
          <Route path="brands/new" element={<BrandFormPage />} />
          <Route path="brands/:id/edit" element={<BrandFormPage />} />
          <Route path="campaigns/new" element={<NewCampaignPage />} />
          <Route path="campaigns/:id" element={<CampaignPage />} />
          <Route path="campaigns" element={<HistoryPage />} />
          <Route path="dataset/annotate" element={<AnnotatePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
