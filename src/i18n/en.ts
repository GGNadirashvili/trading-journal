// English is the source of truth: every key used in the app is defined here.
// ka.ts must define exactly the same keys (the type below enforces it at compile time, i18n.test.ts at run time).
// `{name}` marks a value that is filled in at run time. Keys ending in `_one` / `_other` are the singular / plural form.
export const en = {
  // App-wide
  'app.title': 'Trading Journal',
  'app.demoBanner': 'DEMO MODE: sample data, nothing is saved',
  'common.loading': 'Loading…',

  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.trades': 'Trades',
  'nav.review': 'Weekly review',
  'nav.reports': 'Reports',
  'nav.admin': 'Admin',
  'nav.signOut': 'Sign out',
  'nav.language': 'Language',
  'nav.brand': 'Journal',

  // Login and setup
  'login.email': 'Email',
  'login.password': 'Password',
  'login.signIn': 'Sign in',
  'login.signingIn': 'Signing in…',
  'setup.title': 'Supabase is not configured',
  'setup.before': 'Copy',
  'setup.middle': 'to',
  'setup.after': 'and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.',

  // Units (plural pairs)
  'unit.trade_one': '{n} trade',
  'unit.trade_other': '{n} trades',
  'unit.day_one': '{n} day',
  'unit.day_other': '{n} days',

  // Date ranges
  'range.30D': '30D',
  'range.90D': '90D',
  'range.180D': '180D',
  'range.ALL': 'ALL',

  // Dashboard
  'dash.overview': 'Overview',
  'dash.tradeWin': 'Trade Win',
  'dash.profitFactor': 'Profit Factor',
  'dash.avgWinLoss': 'Avg Win / Loss Trade',
  'dash.netPnl': 'Net P&L',
  'dash.dayStreak': 'Day Streak',
  'dash.tradeStreak': 'Trade Streak',
  'dash.streakWin': 'W',
  'dash.streakLoss': 'L',

  // P&L calendar
  'cal.title': 'P&L Calendar',
  'cal.prevMonth': 'Previous month',
  'cal.nextMonth': 'Next month',
  'cal.weekly': 'Weekly',

  // Common
  'common.delete': 'Delete',
  'confirm.title': 'Are you sure?',
  'confirm.yes': 'Yes',
  'confirm.no': 'No',
  'dir.long': 'Long',
  'dir.short': 'Short',
  'unit.minutes': '{n}m',
  'unit.hoursMinutes': '{h}h {m}m',

  // Trades list
  'trades.title': 'Trades',
  'trades.allSymbols': 'All symbols',
  'trades.search': 'Search notes, emotions, tags',
  'trades.new': 'New trade',
  'trades.empty': 'No trades yet',
  'trades.col.date': 'Date',
  'trades.col.symbol': 'Symbol',
  'trades.col.dir': 'Dir',
  'trades.col.qty': 'Qty',
  'trades.col.entry': 'Entry',
  'trades.col.exit': 'Exit',
  'trades.col.hold': 'Hold',
  'trades.col.return': 'Return',
  'trades.col.emotion': 'Emotion',

  // Trade page and form
  'trade.new': 'New trade',
  'trade.edit': 'Edit trade',
  'trade.notFound': 'Trade not found.',
  'trade.saveFirst': 'Save the trade first, then open it to attach screenshots.',
  'trade.add': 'Add trade',
  'trade.saveChanges': 'Save changes',
  'trade.saving': 'Saving…',
  'trade.deleteTitle': 'Delete trade',
  'trade.deleteBody': 'Delete this trade and its screenshots? This cannot be undone.',
  'form.symbol': 'Symbol',
  'form.direction': 'Direction',
  'form.qty': 'Quantity',
  'form.entryPrice': 'Entry price',
  'form.exitPrice': 'Exit price',
  'form.entryTime': 'Entry time',
  'form.exitTime': 'Exit time',
  'form.pnl': 'P&L ($), blank = from prices',
  'form.setup': 'Setup',
  'form.setupHint': 'e.g. opening range break',
  'form.tags': 'Tags',
  'form.noTags': 'No tags yet. Add some on the Admin page.',
  'form.emotionalState': 'Emotional state',
  'form.noEmotions': 'No emotions yet. Add some on the Admin page.',
  'form.before': 'Before the trade',
  'form.after': 'After the trade',
  'form.notes': 'Notes',
  'form.pnlRequired': 'Enter the P&L, or entry and exit prices for a symbol that has a point value (set on the Admin page).',

  // Screenshots
  'shots.title': 'Screenshots',
  'shots.drop': 'Click, drop, or paste (Cmd+V) screenshots',
  'shots.uploading': 'Uploading…',
  'shots.alt': 'Trade screenshot',
  'shots.deleteTitle': 'Delete screenshot',
  'shots.deleteBody': 'Delete this screenshot? This cannot be undone.',

  // Built-in emotion names (your own emotions are shown exactly as you typed them)
  'emotion.calm': 'calm',
  'emotion.confident': 'confident',
  'emotion.focused': 'focused',
  'emotion.patient': 'patient',
  'emotion.anxious': 'anxious',
  'emotion.fomo': 'fomo',
  'emotion.revenge': 'revenge',
  'emotion.greedy': 'greedy',
  'emotion.frustrated': 'frustrated',
  'emotion.tired': 'tired',
  'emotion.bored': 'bored',
  'emotion.overconfident': 'overconfident',
} as const

export type MessageKey = keyof typeof en
