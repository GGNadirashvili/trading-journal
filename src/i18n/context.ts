import { createContext, useContext } from 'react'
import type { MessageKey } from './en'

export type Lang = 'en' | 'ka'
export const LANGS: Lang[] = ['en', 'ka']

export type Params = Record<string, string | number>

export interface I18n {
  lang: Lang
  setLang: (l: Lang) => void
  /** Date/number locale for the current language, e.g. for toLocaleDateString. */
  locale: string
  t: (key: MessageKey, params?: Params) => string
  /** Plural form: uses `<key>_one` when n is 1, otherwise `<key>_other`. `{n}` is filled in automatically. */
  tn: (key: string, n: number, params?: Params) => string
  /** Display name of an emotion: built-in names are translated, anything you added yourself is shown as typed. */
  te: (name: string) => string
}

export const I18nContext = createContext<I18n | null>(null)

export function useI18n(): I18n {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside LanguageProvider')
  return ctx
}
