// Weeks run Monday to Sunday. A week is identified by its Monday as a local "YYYY-MM-DD" key.

const pad = (n: number) => String(n).padStart(2, '0')
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function weekStartOf(date: Date): string {
  const daysSinceMonday = (date.getDay() + 6) % 7
  return toKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday))
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key)
  return toKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n))
}

export const addWeeks = (key: string, n: number) => addDays(key, n * 7)

/** True when the day key (YYYY-MM-DD) falls inside the week that starts on `weekKey`. */
export const inWeek = (day: string, weekKey: string) => day >= weekKey && day <= addDays(weekKey, 6)

export function formatWeek(weekKey: string): string {
  const start = parseKey(weekKey)
  const end = parseKey(addDays(weekKey, 6))
  const short = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${short(start)} – ${short(end)}, ${end.getFullYear()}`
}
