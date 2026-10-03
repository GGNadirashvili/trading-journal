export function money(n: number, opts: { sign?: boolean } = {}): string {
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const sign = n < 0 ? '-' : opts.sign && n > 0 ? '+' : ''
  return `${sign}$${abs}`
}

export const pnlColor = (n: number) => (n > 0 ? 'text-green' : n < 0 ? 'text-loss' : 'text-muted')

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

export function holdTime(a: string, b: string | null): string {
  if (!b) return '-'
  const mins = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000)
  return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`
}

const pad = (n: number) => String(n).padStart(2, '0')

/** ISO timestamp -> value for <input type="datetime-local"> (local time). */
export function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const fromLocalInput = (v: string): string | null => (v ? new Date(v).toISOString() : null)
