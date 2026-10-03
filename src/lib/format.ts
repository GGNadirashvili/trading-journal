export function money(n: number, opts: { sign?: boolean } = {}): string {
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const sign = n < 0 ? '-' : opts.sign && n > 0 ? '+' : ''
  return `${sign}$${abs}`
}

export const pnlColor = (n: number) => (n > 0 ? 'text-green' : n < 0 ? 'text-loss' : 'text-muted')

export { formatDate as fmtDate, formatTime as fmtTime } from '../i18n/dates'

/** Whole minutes between entry and exit, or null when there is no exit time. */
export function holdMinutes(entry: string, exit: string | null): number | null {
  if (!exit) return null
  return Math.round((new Date(exit).getTime() - new Date(entry).getTime()) / 60000)
}

const pad = (n: number) => String(n).padStart(2, '0')

/** ISO timestamp -> value for <input type="datetime-local"> (local time). */
export function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const fromLocalInput = (v: string): string | null => (v ? new Date(v).toISOString() : null)
