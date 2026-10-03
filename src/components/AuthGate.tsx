import type { ReactNode } from 'react'
import { useAuth } from '../lib/authContext'
import { DEMO } from '../lib/demo'
import { isConfigured } from '../lib/supabase'
import Login from '../pages/Login'

export default function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (DEMO) return <>{children}</>
  if (!isConfigured) {
    return (
      <div className="p-6">
        <h1 className="mb-2 text-xl font-semibold">Supabase is not configured</h1>
        <p className="text-muted">
          Copy <code className="text-green">.env.example</code> to <code className="text-green">.env.local</code> and fill in
          VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.
        </p>
      </div>
    )
  }
  if (loading) return <div className="p-6 text-muted">Loading…</div>
  return session ? <>{children}</> : <Login />
}
