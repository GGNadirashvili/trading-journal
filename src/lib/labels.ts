import type { Lang } from '../i18n/context'
import { translateEmotion } from '../i18n/translate'
import { DEFAULT_EMOTIONS, type OptionItem, type OptionKind } from './settingsTypes'

/** True when the text contains at least one Georgian (Mkhedruli) letter. */
export const hasGeorgian = (s: string): boolean => /[ა-ჿ]/.test(s)

/**
 * The stored Georgian name of an item, or null when it has none or is clearly damaged. A built-in emotion whose
 * Georgian name contains no Georgian letter at all was saved with the wrong text encoding, so it is ignored and the
 * built-in translation is used instead. (Custom items are trusted: a Georgian name may legitimately be just "CPI".)
 */
export function georgianName(item: OptionItem): string | null {
  if (!item.nameKa) return null
  if (item.kind === 'emotion' && (DEFAULT_EMOTIONS as string[]).includes(item.name) && !hasGeorgian(item.nameKa)) return null
  return item.nameKa
}

/**
 * The name to show for an emotion, tag or setup. `name` is the English name saved on trades.
 * In Georgian: the item's Georgian name if it has one, else (emotions only) the built-in translation, else the English name.
 */
export function optionLabel(options: OptionItem[], lang: Lang, kind: OptionKind, name: string): string {
  if (lang !== 'ka') return name
  const item = options.find((o) => o.kind === kind && o.name === name)
  const stored = item ? georgianName(item) : null
  if (stored) return stored
  return kind === 'emotion' ? translateEmotion('ka', name) : name
}

export type NameError = 'empty' | 'englishHasGeorgian'

/** Checks the two names typed in the add form. The English field must really be English, so the two fields cannot be swapped by mistake. */
export function validateNames(name: string, nameKa: string): NameError | null {
  if (!name.trim() || !nameKa.trim()) return 'empty'
  if (hasGeorgian(name)) return 'englishHasGeorgian'
  return null
}
