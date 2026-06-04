import { Outlet } from 'react-router-dom'
import { Sidebar, MobileBottomNav } from './Sidebar'
import { OfflineBanner } from '../ui/OfflineBanner'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
        <OfflineBanner />
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  )
}
