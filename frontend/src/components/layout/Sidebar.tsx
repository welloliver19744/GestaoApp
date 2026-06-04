import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Settings, PiggyBank, LogOut, Repeat, Target, Image, BarChart3, Users } from 'lucide-react'
import { cn } from '../../lib/utils'
import { pb } from '../../api/client'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transações' },
  { to: '/recurring', icon: Repeat, label: 'Recorrências' },
  { to: '/goals', icon: Target, label: 'Metas' },
  { to: '/groups', icon: Users, label: 'Grupos' },
  { to: '/receipts', icon: Image, label: 'Comprovantes' },
  { to: '/reports', icon: BarChart3, label: 'Relatórios' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 h-screen bg-surface-950 border-r border-surface-800 flex-col shrink-0">
      <div className="p-5 border-b border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
            <PiggyBank size={20} className="text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-surface-100">Gestão Casa</h1>
            <p className="text-xs text-surface-500">Finanças domésticas</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-neon-cyan/10 text-neon-cyan'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-900'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-surface-800">
        {pb.authStore.record && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm text-surface-200 truncate">{pb.authStore.record.name || pb.authStore.record.email}</p>
            <p className="text-xs text-surface-500 truncate">{pb.authStore.record.email}</p>
          </div>
        )}
        <button
          onClick={() => {
            pb.authStore.clear()
            window.location.href = '/login'
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-surface-400 hover:text-neon-red hover:bg-surface-900 transition-all w-full"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  )
}

export function MobileBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-950 border-t border-surface-800 flex items-center justify-around py-1 safe-area-pb">
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 min-w-0',
              isActive
                ? 'text-neon-cyan'
                : 'text-surface-400 hover:text-surface-200'
            )
          }
        >
          <Icon size={20} />
          <span className="text-[10px] leading-none">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
