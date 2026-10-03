import type { ReactNode } from 'react'
import { useI18n } from '../i18n/context'
import { useAuth } from '../lib/authContext'
import { DEMO } from '../lib/demo'
import { isConfigured } from '../lib/supabase'
import Login from '../pages/Login'

export default function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const { t } = useI18n()

  if (DEMO) return <>{children}</>
  if (!isConfigured) {
    return (
      <div className="p-6">
        <h1 className="mb-2 text-xl font-semibold">{t('setup.title')}</h1>
        <p className="text-muted">
          {t('setup.before')} <code className="text-fg">.env.example</code> {t('setup.middle')} <code className="text-fg">.env.local</code>{' '}
          {t('setup.after')}
        </p>
      </div>
    )
  }
  if (loading) return <div className="p-6 text-muted">{t('common.loading')}</div>
  return session ? <>{children}</> : <Login />
}
