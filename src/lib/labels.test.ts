import { describe, expect, it } from 'vitest'
import { hasGeorgian, optionLabel, validateNames } from './labels'
import type { OptionItem } from './settingsTypes'

const options: OptionItem[] = [
  { id: '1', kind: 'emotion', name: 'calm', nameKa: 'მშვიდი' },
  { id: '2', kind: 'emotion', name: 'restless', nameKa: 'მოუსვენარი' },
  { id: '3', kind: 'emotion', name: 'fomo', nameKa: null }, // no stored Georgian name: falls back to the built-in translation
  { id: '4', kind: 'tag', name: 'news', nameKa: 'სიახლეები' },
  { id: '5', kind: 'setup', name: 'breakout', nameKa: null },
]

describe('optionLabel', () => {
  it('shows the English name in English, whatever the Georgian name is', () => {
    expect(optionLabel(options, 'en', 'emotion', 'restless')).toBe('restless')
    expect(optionLabel(options, 'en', 'tag', 'news')).toBe('news')
  })
  it('shows the stored Georgian name in Georgian', () => {
    expect(optionLabel(options, 'ka', 'emotion', 'restless')).toBe('მოუსვენარი')
    expect(optionLabel(options, 'ka', 'tag', 'news')).toBe('სიახლეები')
  })
  it('falls back to the built-in emotion translation, then to the English name', () => {
    expect(optionLabel(options, 'ka', 'emotion', 'fomo')).toBe('FOMO (გამოტოვების შიში)')
    expect(optionLabel(options, 'ka', 'setup', 'breakout')).toBe('breakout')
    expect(optionLabel(options, 'ka', 'tag', 'deleted-tag')).toBe('deleted-tag') // an item removed from the list still shows on old trades
    expect(optionLabel([], 'ka', 'emotion', 'calm')).toBe('მშვიდი')
  })
  it('matches by kind, so the same English word in two lists does not mix', () => {
    const two: OptionItem[] = [
      { id: 'a', kind: 'tag', name: 'trend', nameKa: 'ტრენდი (ტეგი)' },
      { id: 'b', kind: 'setup', name: 'trend', nameKa: 'ტრენდი (სეტაპი)' },
    ]
    expect(optionLabel(two, 'ka', 'tag', 'trend')).toBe('ტრენდი (ტეგი)')
    expect(optionLabel(two, 'ka', 'setup', 'trend')).toBe('ტრენდი (სეტაპი)')
  })
})

describe('validation', () => {
  it('detects Georgian letters', () => {
    expect(hasGeorgian('მშვიდი')).toBe(true)
    expect(hasGeorgian('FOMO (შიში)')).toBe(true)
    expect(hasGeorgian('calm')).toBe(false)
    expect(hasGeorgian('CPI 2026')).toBe(false)
  })
  it('requires both names', () => {
    expect(validateNames('', 'მშვიდი')).toBe('empty')
    expect(validateNames('calm', '  ')).toBe('empty')
  })
  it('rejects Georgian letters in the English field (fields swapped)', () => {
    expect(validateNames('მშვიდი', 'calm')).toBe('englishHasGeorgian')
  })
  it('accepts a normal pair, and a Georgian name that is just a Latin acronym', () => {
    expect(validateNames('restless', 'მოუსვენარი')).toBeNull()
    expect(validateNames('CPI day', 'CPI')).toBeNull()
  })
})
