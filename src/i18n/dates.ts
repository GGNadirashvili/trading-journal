// Month and weekday names and date formats per language.
// Georgian is written out by hand: not every browser ships Georgian locale data, and a missing locale would
// silently show English month names. English still uses the browser's Intl.

const KA_MONTHS = ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი']
const KA_MONTHS_SHORT = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ']
const KA_WEEKDAYS = ['კვი', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ'] // Sunday first

const isKa = (locale: string) => locale.toLowerCase().startsWith('ka')
const pad = (n: number) => String(n).padStart(2, '0')

/** Full month names, January first. */
export function monthNames(locale: string): string[] {
  if (isKa(locale)) return KA_MONTHS
  return Array.from({ length: 12 }, (_, m) => new Date(2026, m, 1).toLocaleDateString(locale, { month: 'long' }))
}

/** Short weekday names, Sunday first. (2026-09-06 is a Sunday.) */
export function weekdayNames(locale: string): string[] {
  if (isKa(locale)) return KA_WEEKDAYS
  return Array.from({ length: 7 }, (_, i) => new Date(2026, 8, 6 + i).toLocaleDateString(locale, { weekday: 'short' }))
}

/** Short day + month, for example "Sep 7" or "7 სექ". */
export function monthDay(d: Date, locale: string): string {
  return isKa(locale) ? `${d.getDate()} ${KA_MONTHS_SHORT[d.getMonth()]}` : d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

/** Numeric date: 09/11/2026 in English, 11.09.2026 in Georgian. */
export function formatDate(iso: string, locale: string): string {
  const d = new Date(iso)
  return isKa(locale) ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}` : `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`
}

/** 24-hour time, 09:30. Same in both languages. */
export function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
