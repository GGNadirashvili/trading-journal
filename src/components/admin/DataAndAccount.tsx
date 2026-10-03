import { useEffect, useState, type FormEvent } from 'react'
import { buildBackup, download, tradesToCsv } from '../../lib/backup'
import { useAuth } from '../../lib/authContext'
import { DEMO } from '../../lib/demo'
import { listReviews } from '../../lib/reviewsApi'
import { useSettings } from '../../lib/settingsContext'
import { supabase } from '../../lib/supabase'
import { useTrades } from '../../lib/tradesContext'

const input = 'rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green'
const card = 'space-y-3 rounded-xl border border-line bg-surface p-4'
const today = () => new Date().toISOString().slice(0, 10)

type SignupStatus = 'checking' | 'disabled' | 'enabled' | 'unknown'
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const canCheck = !DEMO && Boolean(url && key)

/** Asks Supabase whether new users can still sign up. Anything but "disabled" means someone else could create an account. */
function useSignupStatus(): SignupStatus {
  const [status, setStatus] = useState<SignupStatus>(canCheck ? 'checking' : 'unknown')
  useEffect(() => {
    if (!canCheck) return
    fetch(`${url}/auth/v1/settings`, { headers: { apikey: key! } })
      .then((r) => r.json())
      .then((j: { disable_signup?: boolean }) => setStatus(j.disable_signup === true ? 'disabled' : j.disable_signup === false ? 'enabled' : 'unknown'))
      .catch(() => setStatus('unknown'))
  }, [])
  return status
}

export default function DataAndAccount() {
  const { session } = useAuth()
  const { trades } = useTrades()
  const { symbols, options } = useSettings()
  const signup = useSignupStatus()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  async function exportJson() {
    setExportError(null)
    try {
      const reviews = await listReviews()
      download(`trading-journal-backup-${today()}.json`, JSON.stringify(buildBackup(trades, reviews, symbols, options), null, 2), 'application/json')
    } catch (e) {
      setExportError((e as Error).message)
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (pw.length < 8) return setMsg({ ok: false, text: 'Use at least 8 characters.' })
    if (pw !== pw2) return setMsg({ ok: false, text: 'The two passwords do not match.' })
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) return setMsg({ ok: false, text: error.message })
    setPw('')
    setPw2('')
    setMsg({ ok: true, text: 'Password changed.' })
  }

  return (
    <>
      <section className={card}>
        <h2 className="text-lg font-semibold">Security</h2>
        <p className="text-sm">
          Signed in as <span className="font-semibold">{DEMO ? 'demo (no login)' : (session?.user.email ?? 'unknown')}</span>
        </p>
        {signup === 'disabled' && <p className="text-sm text-green">New signups are disabled. You are the only user who can log in.</p>}
        {signup === 'enabled' && (
          <p className="rounded-lg border border-loss p-3 text-sm text-loss">
            New signups are ENABLED, so anyone could create an account. Your data is still protected by row-level security, but turn this off in
            Supabase: Authentication, Sign In / Providers, "Allow new users to sign up".
          </p>
        )}
        {signup === 'unknown' && <p className="text-sm text-muted">Could not check the signup setting{DEMO ? ' in demo mode' : ''}.</p>}
        {signup === 'checking' && <p className="text-sm text-muted">Checking signup setting…</p>}
      </section>

      <section className={card}>
        <h2 className="text-lg font-semibold">Backup</h2>
        <p className="text-sm text-muted">Download your data. Screenshots are not included; they stay in Supabase Storage.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportJson} className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black">
            Download backup (JSON)
          </button>
          <button onClick={() => download(`trades-${today()}.csv`, tradesToCsv(trades), 'text/csv')} className="rounded-lg border border-line px-4 py-2 text-sm hover:text-green">
            Download trades (CSV)
          </button>
        </div>
        {exportError && <p className="text-sm text-loss">{exportError}</p>}
      </section>

      {!DEMO && (
        <section className={card}>
          <h2 className="text-lg font-semibold">Change password</h2>
          <form onSubmit={changePassword} className="flex flex-wrap items-center gap-2">
            <input className={`${input} w-56`} type="password" autoComplete="new-password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} required />
            <input className={`${input} w-56`} type="password" autoComplete="new-password" placeholder="Repeat new password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
            <button className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black">Change</button>
          </form>
          {msg && <p className={`text-sm ${msg.ok ? 'text-green' : 'text-loss'}`}>{msg.text}</p>}
        </section>
      )}
    </>
  )
}
