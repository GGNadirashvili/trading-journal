import type { MessageKey } from './en'

// Georgian. Must contain exactly the keys of en.ts.
export const ka: Record<MessageKey, string> = {
  'app.title': 'სავაჭრო ჟურნალი',
  'app.demoBanner': 'დემო რეჟიმი: სანიმუშო მონაცემები, არაფერი ინახება',
  'common.loading': 'იტვირთება…',

  'nav.dashboard': 'მთავარი',
  'nav.trades': 'ტრეიდები',
  'nav.review': 'კვირის მიმოხილვა',
  'nav.reports': 'ანგარიშები',
  'nav.admin': 'ადმინი',
  'nav.signOut': 'გასვლა',
  'nav.language': 'ენა',

  'login.email': 'ელფოსტა',
  'login.password': 'პაროლი',
  'login.signIn': 'შესვლა',
  'login.signingIn': 'შესვლა…',
  'setup.title': 'Supabase არ არის დაკონფიგურირებული',
  'setup.before': 'დააკოპირეთ',
  'setup.middle': 'ფაილში',
  'setup.after': 'და შეავსეთ VITE_SUPABASE_URL და VITE_SUPABASE_ANON_KEY, შემდეგ გადატვირთეთ dev სერვერი.',

  'unit.trade_one': '{n} ტრეიდი',
  'unit.trade_other': '{n} ტრეიდი',
  'unit.day_one': '{n} დღე',
  'unit.day_other': '{n} დღე',

  'range.30D': '30დ',
  'range.90D': '90დ',
  'range.180D': '180დ',
  'range.ALL': 'ყველა',

  'dash.overview': 'მიმოხილვა',
  'dash.tradeWin': 'მოგებული ტრეიდები',
  'dash.profitFactor': 'პროფიტ ფაქტორი',
  'dash.avgWinLoss': 'საშ. მოგება / წაგება ტრეიდზე',
  'dash.netPnl': 'წმინდა P&L',
  'dash.dayStreak': 'დღეების სერია',
  'dash.tradeStreak': 'ტრეიდების სერია',
  'dash.streakWin': 'მოგ',
  'dash.streakLoss': 'წაგ',

  'cal.title': 'P&L კალენდარი',
  'cal.prevMonth': 'წინა თვე',
  'cal.nextMonth': 'შემდეგი თვე',
  'cal.weekly': 'კვირა',
}
