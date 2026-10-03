import type { WeeklyReview } from './reviewsApi'
import type { OptionItem, SymbolDef } from './settingsTypes'
import type { Trade } from './types'

/** One CSV cell: quoted when it contains a comma, quote or line break; quotes are doubled. */
export function csvCell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function tradesToCsv(trades: Trade[]): string {
  const head = ['entry_time', 'exit_time', 'symbol', 'direction', 'qty', 'entry_price', 'exit_price', 'pnl', 'session', 'setup', 'tags', 'emotion_tags', 'emotion_before', 'emotion_after', 'notes']
  const rows = trades.map((t) =>
    [t.entryTime, t.exitTime, t.symbol, t.direction, t.qty, t.entryPrice, t.exitPrice, t.pnl, t.session, t.setup, t.tags.join('; '), t.emotionTags.join('; '), t.emotionBefore, t.emotionAfter, t.notes]
      .map(csvCell)
      .join(','),
  )
  return [head.join(','), ...rows].join('\n')
}

export interface Backup {
  exportedAt: string
  note: string
  trades: Trade[]
  weeklyReviews: WeeklyReview[]
  symbols: Omit<SymbolDef, 'id'>[]
  options: Omit<OptionItem, 'id'>[]
}

export function buildBackup(trades: Trade[], reviews: WeeklyReview[], symbols: SymbolDef[], options: OptionItem[]): Backup {
  return {
    exportedAt: new Date().toISOString(),
    note: 'Screenshots are not included; they stay in Supabase Storage.',
    trades,
    weeklyReviews: reviews,
    symbols: symbols.map(({ code, pointValue }) => ({ code, pointValue })),
    options: options.map(({ kind, name, nameKa }) => ({ kind, name, nameKa })),
  }
}

/** Save text as a file through the browser. */
export function download(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
