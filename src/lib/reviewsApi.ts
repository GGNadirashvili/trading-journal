import { DEMO } from './demo'
import { supabase } from './supabase'

export type Bias = 'bullish' | 'bearish' | 'neutral' | 'unclear'
export const BIASES: Bias[] = ['bullish', 'bearish', 'neutral', 'unclear']

/** One week's notes. `weekStart` is that week's Monday (YYYY-MM-DD). */
export interface WeeklyReview {
  weekStart: string
  // Looking back at this week
  emotional: string
  technical: string
  mistakes: string
  lessons: string
  // Thoughts about the FOLLOWING week
  bias: Bias | null
  outlook: string
  keyLevels: string
  plan: string
}

export const emptyReview = (weekStart: string): WeeklyReview => ({
  weekStart,
  emotional: '',
  technical: '',
  mistakes: '',
  lessons: '',
  bias: null,
  outlook: '',
  keyLevels: '',
  plan: '',
})

interface Row {
  week_start: string
  emotional: string | null
  technical: string | null
  mistakes: string | null
  lessons: string | null
  bias: Bias | null
  outlook: string | null
  key_levels: string | null
  plan: string | null
}

const fromRow = (r: Row): WeeklyReview => ({
  weekStart: r.week_start,
  emotional: r.emotional ?? '',
  technical: r.technical ?? '',
  mistakes: r.mistakes ?? '',
  lessons: r.lessons ?? '',
  bias: r.bias,
  outlook: r.outlook ?? '',
  keyLevels: r.key_levels ?? '',
  plan: r.plan ?? '',
})

const demoStore = new Map<string, WeeklyReview>()

/** Returns null when nothing has been written for that week yet. */
export async function getReview(weekStart: string): Promise<WeeklyReview | null> {
  if (DEMO) return demoStore.get(weekStart) ?? null
  const { data, error } = await supabase.from('weekly_reviews').select('*').eq('week_start', weekStart).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? fromRow(data as Row) : null
}

export async function saveReview(r: WeeklyReview): Promise<void> {
  if (DEMO) {
    demoStore.set(r.weekStart, r)
    return
  }
  const { error } = await supabase.from('weekly_reviews').upsert(
    {
      week_start: r.weekStart,
      emotional: r.emotional,
      technical: r.technical,
      mistakes: r.mistakes,
      lessons: r.lessons,
      bias: r.bias,
      outlook: r.outlook,
      key_levels: r.keyLevels,
      plan: r.plan,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,week_start' },
  )
  if (error) throw new Error(error.message)
}
