import { describe, expect, it } from 'vitest'
import { evaluateAccount, floorFor, type Account } from './accounts'

const base: Account = {
  id: 'a1',
  name: 'TEST-50K',
  startBalance: 50000,
  maxDrawdown: 2000,
  profitGoal: 53000,
  drawdownType: 'trailing',
  lockAtStart: true,
  adjustment: 0,
  peakBaseline: null,
  manualStatus: null,
  manualClosedAt: null,
  openedAt: '2026-09-01',
}

let n = 0
// midday local time so the local calendar day is the same in any timezone
const trade = (pnl: number, month: number, day: number, hour = 12) => ({ id: `t${String(++n).padStart(3, '0')}`, pnl, entryTime: new Date(2026, month - 1, day, hour).toISOString() })
const TODAY = '2026-10-03'

describe('your account: 50k, drawdown 2k, goal 53k, currently 49k', () => {
  const mine: Account = { ...base, adjustment: -1000 }
  const s = evaluateAccount(mine, [], TODAY)
  it('shows the balance, the floor and what you can still lose', () => {
    expect(s.balance).toBe(49000)
    expect(s.floor).toBe(48000)
    expect(s.buffer).toBe(1000)
    expect(s.status).toBe('active')
  })
  it('shows how far the goal is', () => {
    expect(s.toGoal).toBe(4000)
    expect(s.goalPct).toBe(0) // still below the starting balance
    expect(s.drawdownUsedPct).toBe(0.5)
    expect(s.profit).toBe(-1000)
  })
  it('counts new trades on top of it', () => {
    const t = evaluateAccount(mine, [trade(-300, 9, 7), trade(+500, 9, 8)], TODAY)
    expect(t.balance).toBe(49200)
    expect(t.buffer).toBe(1200)
  })
})

describe('your real Tradeify Select 50k account (from its dashboard)', () => {
  // Dashboard: balance $48,994.50, trailing max drawdown level $48,034.00, profit target -$1,005.50 / $3,000.00.
  // The level 48,034 = 2,000 below a highest balance of 50,034, so that peak is entered as "highest balance so far".
  const real: Account = { ...base, name: 'Select 50k', drawdownType: 'trailing_eod', adjustment: -1005.5, peakBaseline: 50034 }
  const s = evaluateAccount(real, [], TODAY)
  it('reproduces what the firm shows', () => {
    expect(s.balance).toBe(48994.5)
    expect(s.profit).toBe(-1005.5) // the "-$1,005.50" next to "/ $3,000.00"
    expect(s.floor).toBe(48034) // the "Trailing Max Drawdown $48,034.00"
    expect(s.status).toBe('active')
  })
  it('shows the true room left and the true distance to the goal', () => {
    expect(s.buffer).toBe(960.5) // not a round 1,000: the peak was 50,034
    expect(s.toGoal).toBe(4005.5) // 3,000 target + the 1,005.50 already lost
    expect(s.drawdownUsedPct).toBeCloseTo(0.51975)
  })
  it('a loss of exactly the remaining room fails the account', () => {
    const t = evaluateAccount(real, [trade(-960.5, 9, 7)], TODAY)
    expect(t.status).toBe('failed')
    expect(t.balance).toBe(48034)
  })
})

describe('floors', () => {
  it('static stays put', () => {
    expect(floorFor({ ...base, drawdownType: 'static' }, 53000)).toBe(48000)
  })
  it('trailing follows the peak and locks at the starting balance', () => {
    expect(floorFor(base, 50000)).toBe(48000)
    expect(floorFor(base, 51000)).toBe(49000)
    expect(floorFor(base, 52000)).toBe(50000) // locked
    expect(floorFor(base, 54000)).toBe(50000) // still locked
  })
  it('trailing without the lock keeps rising', () => {
    expect(floorFor({ ...base, lockAtStart: false }, 54000)).toBe(52000)
  })
})

describe('evaluateAccount', () => {
  it('trailing: the floor rises after a win', () => {
    const s = evaluateAccount(base, [trade(1500, 9, 7)], TODAY)
    expect(s.balance).toBe(51500)
    expect(s.peak).toBe(51500)
    expect(s.floor).toBe(49500)
    expect(s.buffer).toBe(2000)
  })
  it('trailing: a win then a loss back to the locked floor fails the account', () => {
    const s = evaluateAccount(base, [trade(2000, 9, 7), trade(-2000, 9, 8)], TODAY)
    expect(s.status).toBe('failed')
    expect(s.endedOn).toBe('2026-09-08')
    expect(s.balance).toBe(50000)
  })
  it('static: reaching the floor exactly fails, and later trades are ignored', () => {
    const s = evaluateAccount({ ...base, drawdownType: 'static' }, [trade(-1500, 9, 7), trade(-500, 9, 8), trade(+9000, 9, 9)], TODAY)
    expect(s.status).toBe('failed')
    expect(s.endedOn).toBe('2026-09-08')
    expect(s.balance).toBe(48000)
    expect(s.trades).toBe(3) // all trades are counted as belonging to it, but the last one does not move the balance
  })
  it('reaching the goal passes the account', () => {
    const s = evaluateAccount(base, [trade(1000, 9, 7), trade(2000, 9, 8)], TODAY)
    expect(s.status).toBe('passed')
    expect(s.endedOn).toBe('2026-09-08')
    expect(s.balance).toBe(53000)
    expect(s.toGoal).toBe(0)
    expect(s.goalPct).toBe(1)
  })
  it('puts trades in time order whatever order they are given', () => {
    const s = evaluateAccount({ ...base, drawdownType: 'static' }, [trade(-500, 9, 8), trade(-1500, 9, 7)], TODAY)
    expect(s.endedOn).toBe('2026-09-08') // the 8th is the trade that reaches 48,000
  })
  it('end-of-day trailing only raises the floor with the day\'s closing balance', () => {
    const eod = { ...base, drawdownType: 'trailing_eod' as const }
    // day 1: +1500 then -1000 -> closes at 50,500. A per-trade trailing floor would use the 51,500 peak.
    const trades = [trade(1500, 9, 7, 10), trade(-1000, 9, 7, 14)]
    const during = evaluateAccount(eod, trades, '2026-09-07') // day not over yet
    expect(during.peak).toBe(50000)
    expect(during.floor).toBe(48000)
    const after = evaluateAccount(eod, trades, '2026-09-08') // day over
    expect(after.peak).toBe(50500)
    expect(after.floor).toBe(48500)
    expect(evaluateAccount(base, trades, '2026-09-08').floor).toBe(49500) // per-trade trailing is stricter
  })
  it('end-of-day trailing: an intraday dip is judged against the previous close', () => {
    const eod = { ...base, drawdownType: 'trailing_eod' as const }
    // day 1 closes at 51,000 (floor then 49,000). Day 2 a -2,000 loss takes it to 49,000 = the floor -> failed
    const s = evaluateAccount(eod, [trade(1000, 9, 7), trade(-2000, 9, 8)], TODAY)
    expect(s.status).toBe('failed')
    expect(s.endedOn).toBe('2026-09-08')
  })
  it('uses a higher known peak from before the journal started', () => {
    const s = evaluateAccount({ ...base, adjustment: -500, peakBaseline: 51000 }, [], TODAY)
    expect(s.balance).toBe(49500)
    expect(s.floor).toBe(49000)
    expect(s.buffer).toBe(500)
    expect(s.drawdownUsedPct).toBe(0.75)
  })
  it('a manual result overrides the numbers and keeps the derived one for reference', () => {
    const s = evaluateAccount({ ...base, manualStatus: 'failed', manualClosedAt: '2026-09-20' }, [trade(100, 9, 7)], TODAY)
    expect(s.status).toBe('failed')
    expect(s.derivedStatus).toBe('active')
    expect(s.endedOn).toBe('2026-09-20')
  })
  it('an account that starts at or below its floor is already failed', () => {
    const s = evaluateAccount({ ...base, adjustment: -2000 }, [], TODAY)
    expect(s.status).toBe('failed')
    expect(s.endedOn).toBe('2026-09-01')
  })
  it('gives chart points: the opening point and one per counted trade', () => {
    const s = evaluateAccount(base, [trade(500, 9, 7), trade(-200, 9, 8)], TODAY)
    expect(s.points.map((p) => p.balance)).toEqual([50000, 50500, 50300])
    expect(s.points).toHaveLength(3)
    expect(s.firstTradeDay).toBe('2026-09-07')
    expect(s.lastTradeDay).toBe('2026-09-08')
  })
})
