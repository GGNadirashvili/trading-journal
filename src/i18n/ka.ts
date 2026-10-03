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
}
