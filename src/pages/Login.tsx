import { useState, type FormEvent } from 'react'
import LanguageSwitch from '../components/LanguageSwitch'
import { useI18n } from '../i18n/context'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setBusy(false)
  }

  const field = 'w-full rounded-lg border border-line bg-surface px-3 py-2 text-fg outline-none focus:border-green'

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute right-3 top-3">
        <LanguageSwitch />
      </div>
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border border-line bg-surface p-6">
        <h1 className="text-xl font-semibold">{t('app.title')}</h1>
        <input className={field} type="email" placeholder={t('login.email')} autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={field} type="password" placeholder={t('login.password')} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-loss">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-green py-2 font-semibold text-black disabled:opacity-50">
          {busy ? t('login.signingIn') : t('login.signIn')}
        </button>
      </form>
    </div>
  )
}
