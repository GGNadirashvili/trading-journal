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
} as const

export type MessageKey = keyof typeof en
