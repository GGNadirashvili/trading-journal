import { en, type MessageKey } from './en'
import { ka } from './ka'
import type { Lang, Params } from './context'

const dictionaries: Record<Lang, Record<string, string>> = { en, ka }

export const LOCALES: Record<Lang, string> = { en: 'en-US', ka: 'ka-GE' }

/** Replace `{name}` placeholders. A placeholder without a value is left as written, so a mistake is visible. */
export function fill(text: string, params?: Params): string {
  return params ? text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole)) : text
}

/** Look a key up in a language; falls back to English, then to the key itself, so a missing string never blanks the UI. */
export function translate(lang: Lang, key: string, params?: Params): string {
  return fill(dictionaries[lang][key] ?? en[key as MessageKey] ?? key, params)
}

export function translatePlural(lang: Lang, key: string, n: number, params?: Params): string {
  return translate(lang, `${key}_${n === 1 ? 'one' : 'other'}`, { n, ...params })
}

export function detectLang(saved: string | null, browser: string | undefined): Lang {
  if (saved === 'en' || saved === 'ka') return saved
  return browser?.toLowerCase().startsWith('ka') ? 'ka' : 'en'
}
