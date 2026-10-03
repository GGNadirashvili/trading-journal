import { describe, expect, it } from 'vitest'
import { en } from './en'
import { ka } from './ka'
import { detectLang, fill, translate, translatePlural } from './translate'

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('dictionaries', () => {
  it('Georgian has exactly the same keys as English', () => {
    expect(Object.keys(ka).sort()).toEqual(Object.keys(en).sort())
  })
  it('no translation is empty', () => {
    for (const [k, v] of [...Object.entries(en), ...Object.entries(ka)]) expect(v.trim(), k).not.toBe('')
  })
  it('every placeholder in English appears in the Georgian text and nothing extra', () => {
    for (const k of Object.keys(en) as (keyof typeof en)[]) expect(placeholders(ka[k]), k).toEqual(placeholders(en[k]))
  })
  it('every _one key has an _other key and vice versa', () => {
    const keys = Object.keys(en)
    for (const k of keys.filter((x) => x.endsWith('_one'))) expect(keys, k).toContain(k.replace(/_one$/, '_other'))
    for (const k of keys.filter((x) => x.endsWith('_other'))) expect(keys, k).toContain(k.replace(/_other$/, '_one'))
  })
})

describe('translate', () => {
  it('fills placeholders and leaves unknown ones visible', () => {
    expect(fill('Hi {name}, {n} left', { name: 'Gio', n: 3 })).toBe('Hi Gio, 3 left')
    expect(fill('Hi {name}', {})).toBe('Hi {name}')
    expect(fill('plain')).toBe('plain')
  })
  it('returns the Georgian text, and falls back to English then to the key', () => {
    expect(translate('ka', 'nav.trades')).toBe(ka['nav.trades'])
    expect(translate('en', 'nav.trades')).toBe('Trades')
    expect(translate('ka', 'no.such.key')).toBe('no.such.key')
  })
  it('chooses singular or plural by the number', () => {
    // uses real keys once plural strings exist; here the fallback path is checked with a missing key
    expect(translatePlural('en', 'x.y', 1)).toBe('x.y_one')
    expect(translatePlural('en', 'x.y', 2)).toBe('x.y_other')
  })
  it('detects the language: saved choice first, then the browser', () => {
    expect(detectLang('ka', 'en-US')).toBe('ka')
    expect(detectLang('en', 'ka-GE')).toBe('en')
    expect(detectLang(null, 'ka-GE')).toBe('ka')
    expect(detectLang(null, 'de-DE')).toBe('en')
    expect(detectLang('xx', undefined)).toBe('en')
  })
})
