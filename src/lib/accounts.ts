import { dayKey } from './stats'
import type { Trade } from './types'

/** How the loss limit (the "floor") behaves.
 *  static:       fixed at start balance minus max drawdown.
 *  trailing:     follows the highest balance reached, updated after every trade.
 *  trailing_eod: follows the highest END-OF-DAY balance (only counts once the day is over).
 *  Both trailing types stop rising once the limit reaches the starting balance. */
export type DrawdownType = 'static' | 'trailing' | 'trailing_eod'
export type AccountStatus = 'active' | 'passed' | 'failed'

export interface Account {
  id: string
  /** The account id as the prop firm shows it. */
  name: string
  startBalance: number
  maxDrawdown: number
  /** The BALANCE to reach (for example 53,000 on a 50,000 account), not the profit amount. */
  profitGoal: number
  drawdownType: DrawdownType
  /** Results made before the journal started, or a correction, so that balance = start + adjustment + trades. */
  adjustment: number
  /** Highest balance reached before the first journaled trade; null = the starting balance. */
  peakBaseline: number | null
  /** Set by hand when the firm ends the account for a reason the numbers cannot show, or to override. */
  manualStatus: 'passed' | 'failed' | null
  manualClosedAt: string | null // YYYY-MM-DD
  openedAt: string // YYYY-MM-DD
}

export interface AccountPoint {
  day: string
  balance: number
  floor: number
}

export interface AccountState {
  status: AccountStatus
  /** What the numbers alone say, ignoring a manual override. */
  derivedStatus: AccountStatus
  /** The day the account passed or failed (YYYY-MM-DD), or null while active. */
  endedOn: string | null
  balance: number
  /** balance minus the starting balance */
  profit: number
  peak: number
  floor: number
  /** how far the balance is above the floor: what you can still lose */
  buffer: number
  /** how much is still needed to reach the goal (0 once reached) */
  toGoal: number
  /** 0..1 progress from the starting balance to the goal */
  goalPct: number
  /** 0..1 how much of the max drawdown is used up */
  drawdownUsedPct: number
  /** trades on this account (all of them, including any after it ended) */
  trades: number
  firstTradeDay: string | null
  lastTradeDay: string | null
  /** opening point followed by one point per counted trade, for charts */
  points: AccountPoint[]
}

type TradeLike = Pick<Trade, 'id' | 'entryTime' | 'pnl'>

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const round2 = (x: number) => Math.round(x * 100) / 100

export function floorFor(a: Account, peak: number): number {
  if (a.drawdownType === 'static') return a.startBalance - a.maxDrawdown
  // A trailing limit follows the highest balance but stops rising once it reaches the starting balance (how most firms work).
  return Math.min(peak - a.maxDrawdown, a.startBalance)
}

/**
 * Works out where an account stands from its trades (pass only the trades that belong to it).
 * A trade that brings the balance to the floor (or below) fails the account; reaching the goal passes it.
 * Whichever happens first ends the account; later trades no longer change its balance.
 * `today` matters for trailing_eod only: a day's closing balance raises the floor once that day is over.
 */
export function evaluateAccount(a: Account, trades: TradeLike[], today: string = dayKey(new Date().toISOString())): AccountState {
  const sorted = [...trades].sort((x, y) => x.entryTime.localeCompare(y.entryTime) || x.id.localeCompare(y.id))
  const eod = a.drawdownType === 'trailing_eod'

  let balance = a.startBalance + a.adjustment
  let peak = Math.max(a.peakBaseline ?? 0, a.startBalance, balance)
  let floor = floorFor(a, peak)
  const points: AccountPoint[] = [{ day: a.openedAt, balance: round2(balance), floor: round2(floor) }]

  let derived: AccountStatus = 'active'
  let endedOn: string | null = null
  if (balance <= floor) {
    derived = 'failed'
    endedOn = a.openedAt
  } else if (balance >= a.profitGoal) {
    derived = 'passed'
    endedOn = a.openedAt
  }

  let currentDay: string | null = null
  for (const t of sorted) {
    if (derived !== 'active') break
    const day = dayKey(t.entryTime)
    if (eod && currentDay !== null && day !== currentDay) peak = Math.max(peak, balance) // the previous day is over
    currentDay = day

    const floorBefore = floorFor(a, peak) // the limit that applied when this trade closed
    balance += t.pnl
    if (balance <= floorBefore) {
      derived = 'failed'
      endedOn = day
    } else if (balance >= a.profitGoal) {
      derived = 'passed'
      endedOn = day
    }
    if (!eod) peak = Math.max(peak, balance)
    floor = floorFor(a, peak)
    points.push({ day, balance: round2(balance), floor: round2(derived === 'failed' ? floorBefore : floor) })
  }
  if (eod && currentDay !== null && currentDay < today) peak = Math.max(peak, balance) // last trading day is over
  floor = derived === 'failed' ? floor : floorFor(a, peak)

  const buffer = balance - floor
  const days = sorted.map((t) => dayKey(t.entryTime))
  return {
    status: a.manualStatus ?? derived,
    derivedStatus: derived,
    endedOn: a.manualStatus ? (a.manualClosedAt ?? endedOn) : endedOn,
    balance: round2(balance),
    profit: round2(balance - a.startBalance),
    peak: round2(peak),
    floor: round2(floor),
    buffer: round2(buffer),
    toGoal: round2(Math.max(0, a.profitGoal - balance)),
    goalPct: clamp01((balance - a.startBalance) / (a.profitGoal - a.startBalance)),
    drawdownUsedPct: clamp01(1 - buffer / a.maxDrawdown),
    trades: sorted.length,
    firstTradeDay: days[0] ?? null,
    lastTradeDay: days.at(-1) ?? null,
    points,
  }
}
