/** The trading sessions a trade can be taken in, in the order they are shown. */
export const SESSIONS = ['asia', 'london', 'ny_premarket', 'ny_am', 'ny_lunch', 'ny_pm', 'outside'] as const
export type Session = (typeof SESSIONS)[number]

export const isSession = (v: unknown): v is Session => typeof v === 'string' && (SESSIONS as readonly string[]).includes(v)
