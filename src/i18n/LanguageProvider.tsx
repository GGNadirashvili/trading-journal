import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, type I18n, type Lang } from './context'
import { detectLang, LOCALES, translate, translatePlural } from './translate'

const STORAGE_KEY = 'tj-lang'

function initialLang(): Lang {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(STORAGE_KEY)
  } catch {
    // storage can be blocked (private window); fall back to the browser language
  }
  return detectLang(saved, navigator.language)
}

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = translate(lang, 'app.title')
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      // not saved; the choice still applies until the page is closed
    }
  }, [])

  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang,
      locale: LOCALES[lang],
      t: (key, params) => translate(lang, key, params),
      tn: (key, n, params) => translatePlural(lang, key, n, params),
    }),
    [lang, setLang],
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
