import { Languages } from 'lucide-react'
import { useI18n } from '../i18n/context'

/** One button that switches to the other language. It shows the name of the language you will get, written in that language. */
export default function LanguageSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n()
  const next = lang === 'en' ? 'ka' : 'en'
  return (
    <button onClick={() => setLang(next)} title={t('nav.language')} aria-label={t('nav.language')} className={`flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:text-green md:justify-start ${className}`}>
      <Languages size={20} />
      <span className="hidden md:inline">{next === 'ka' ? 'ქართული' : 'English'}</span>
    </button>
  )
}
