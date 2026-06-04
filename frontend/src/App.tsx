import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import { AppLayout } from './components/layout/AppLayout'
import { UpdateBanner } from './components/ui/UpdateBanner'
import { Login } from './pages/Login'
import { ToastProvider } from './components/ui/Toast'
import { Dashboard } from './pages/Dashboard'
import { Transactions } from './pages/Transactions'
import { Recurring } from './pages/Recurring'
import { Settings } from './pages/Settings'
import { Goals } from './pages/Goals'
import { ReceiptGallery } from './pages/ReceiptGallery'
import { Reports } from './pages/Reports'
import { Groups } from './pages/Groups'
import { PwaInstallPrompt } from './components/ui/PwaInstallPrompt'
import { Onboarding } from './components/ui/Onboarding'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  useTheme()
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/recurring" element={<Recurring />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/receipts" element={<ReceiptGallery />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <PwaInstallPrompt />
          <Onboarding />
          <UpdateBanner />
        </BrowserRouter>
    </ToastProvider>
  )
}
