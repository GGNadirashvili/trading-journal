import { BarChart3, CalendarDays, LayoutDashboard, ListOrdered, LogOut, Upload } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trades', label: 'Trades', icon: ListOrdered },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/import', label: 'Import', icon: Upload },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-16 shrink-0 flex-col items-center gap-2 border-r border-line bg-surface py-4 md:w-52 md:items-stretch md:px-3">
        <div className="mb-4 text-center text-lg font-bold md:px-2 md:text-left">
          TJ<span className="hidden text-muted md:inline"> Journal</span>
        </div>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={label}
            className={({ isActive }) =>
              `flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm md:justify-start ${
                isActive ? 'bg-surface-2 text-green' : 'text-muted hover:text-green'
              }`
            }
          >
            <Icon size={20} />
            <span className="hidden md:inline">{label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => supabase.auth.signOut()}
          title="Sign out"
          className="mt-auto flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:text-green md:justify-start"
        >
          <LogOut size={20} />
          <span className="hidden md:inline">Sign out</span>
        </button>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
