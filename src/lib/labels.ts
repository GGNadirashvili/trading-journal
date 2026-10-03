import type { Lang } from '../i18n/context'
import { translateEmotion } from '../i18n/translate'
import type { OptionItem, OptionKind } from './settingsTypes'

/** True when the text contains at least one Georgian (Mkhedruli) letter. */
export const hasGeorgian = (s: string): boolean => /[ა-ჿ]/.test(s)

/**
 * The name to show for an emotion, tag or setup. `name` is the English name saved on trades.
 * In Georgian: the item's Georgian name if it has one, else (emotions only) the built-in translation, else the English name.
 */
export function optionLabel(options: OptionItem[], lang: Lang, kind: OptionKind, name: string): string {
  if (lang !== 'ka') return name
  const item = options.find((o) => o.kind === kind && o.name === name)
  if (item?.nameKa) return item.nameKa
  return kind === 'emotion' ? translateEmotion('ka', name) : name
}

export type NameError = 'empty' | 'englishHasGeorgian'

/** Checks the two names typed in the add form. The English field must really be English, so the two fields cannot be swapped by mistake. */
export function validateNames(name: string, nameKa: string): NameError | null {
  if (!name.trim() || !nameKa.trim()) return 'empty'
  if (hasGeorgian(name)) return 'englishHasGeorgian'
  return null
}
