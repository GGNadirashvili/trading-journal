export interface SymbolDef {
  id: string
  code: string
  pointValue: number // dollars per full price point, per contract
}

export type OptionKind = 'emotion' | 'tag' | 'setup'

export interface OptionItem {
  id: string
  kind: OptionKind
  /** English name. This is the value saved on trades. */
  name: string
  /** Georgian name, shown when the app is in Georgian. Null for items created before Georgian names existed. */
  nameKa: string | null
}

// Used before the settings tables exist, and in demo mode.
export const DEFAULT_SYMBOLS: Omit<SymbolDef, 'id'>[] = [
  { code: 'MNQ', pointValue: 2 },
  { code: 'ES', pointValue: 50 },
]

export const DEFAULT_EMOTIONS = [
  'calm',
  'confident',
  'focused',
  'patient',
  'anxious',
  'fomo',
  'revenge',
  'greedy',
  'frustrated',
  'tired',
  'bored',
  'overconfident',
]
