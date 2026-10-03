import { BarChart3, BookOpen, LayoutDashboard, ListOrdered, LogOut, Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../i18n/context'
import { DEMO } from '../lib/demo'
import { supabase } from '../lib/supabase'
import type { MessageKey } from '../i18n/en'
import LanguageSwitch from './LanguageSwitch'

const NAV: { to: string; label: MessageKey; icon: typeof LayoutDashboard }[] = [
  { to: '/', label: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/trades', label: 'nav.trades', icon: ListOrdered },
  { to: '/review', label: 'nav.review', icon: BookOpen },
  { to: '/reports', label: 'nav.reports', icon: BarChart3 },
  { to: '/admin', label: 'nav.admin', icon: Settings },
]

export default function Layout() {
  const { t } = useI18n()
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
            title={t(label)}
            className={({ isActive }) =>
              `flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm md:justify-start ${
                isActive ? 'bg-surface-2 text-green' : 'text-muted hover:text-green'
              }`
            }
          >
            <Icon size={20} />
            <span className="hidden md:inline">{t(label)}</span>
          </NavLink>
        ))}
        <LanguageSwitch className="mt-auto" />
        <button
          onClick={() => supabase.auth.signOut()}
          title={t('nav.signOut')}
          className="flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:text-green md:justify-start"
        >
          <LogOut size={20} />
          <span className="hidden md:inline">{t('nav.signOut')}</span>
        </button>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-6">
        {DEMO && <div className="mb-4 rounded-lg border border-warn px-3 py-2 text-sm text-warn">{t('app.demoBanner')}</div>}
        <Outlet />
      </main>
    </div>
  )
}
