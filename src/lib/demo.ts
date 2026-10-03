import type { Session } from './sessions'
import type { Account } from './accounts'
import type { Trade } from './types'

// Dev-only sample data so the UI can be checked before Supabase exists.
// Enabled with VITE_DEMO=1 in `npm run dev`; the production build never includes it.
export const DEMO = import.meta.env.DEV && import.meta.env.VITE_DEMO === '1'

export const DEMO_ACCOUNT_NOW = 'acc-demo-now'
export const DEMO_ACCOUNT_OLD = 'acc-demo-old'

export function demoAccounts(): Account[] {
  return [
    { id: DEMO_ACCOUNT_NOW, name: 'DEMO-50K-002', startBalance: 50000, maxDrawdown: 2000, profitGoal: 53000, drawdownType: 'trailing', adjustment: 0, peakBaseline: null, manualStatus: null, manualClosedAt: null, openedAt: '2026-09-01' },
    { id: DEMO_ACCOUNT_OLD, name: 'DEMO-50K-001', startBalance: 50000, maxDrawdown: 2000, profitGoal: 53000, drawdownType: 'trailing', adjustment: 0, peakBaseline: null, manualStatus: null, manualClosedAt: null, openedAt: '2026-08-01' },
  ]
}

export function demoTrades(): Trade[] {
  const base = (id: string, day: number, hour: number, symbol: string, direction: 'long' | 'short', pnl: number, session: Session, accountId = DEMO_ACCOUNT_NOW, month = 8): Trade => ({
    id,
    symbol,
    direction,
    qty: 1,
    entryPrice: null,
    exitPrice: null,
    entryTime: new Date(2026, month, day, hour, 30).toISOString(),
    exitTime: new Date(2026, month, day, hour, 50).toISOString(),
    pnl,
    setup: null,
    tags: [],
    emotionBefore: 'calm',
    emotionAfter: pnl < 0 ? 'frustrated' : 'confident',
    emotionTags: [pnl < 0 ? 'frustrated' : 'confident'],
    notes: null,
    session,
    accountId,
  })
  return [
    base('d1', 7, 9, 'MNQ', 'long', 119.2, 'ny_am'),
    base('d2', 7, 10, 'MNQ', 'short', -111.8, 'ny_am'),
    base('d3', 8, 9, 'ES', 'long', 212.5, 'london'),
    base('d4', 9, 10, 'MNQ', 'long', -286.2, 'ny_am'),
    base('d5', 9, 11, 'MNQ', 'long', -175.8, 'ny_lunch'),
    base('d6', 10, 9, 'ES', 'short', 85.9, 'ny_pm'),
    base('d7', 11, 9, 'MNQ', 'short', 64.1, 'asia'),
    // an older account that failed in August
    base('o1', 4, 9, 'MNQ', 'long', -900, 'ny_am', DEMO_ACCOUNT_OLD, 7),
    base('o2', 5, 10, 'MNQ', 'long', -700, 'ny_am', DEMO_ACCOUNT_OLD, 7),
    base('o3', 6, 14, 'ES', 'short', -500, 'ny_pm', DEMO_ACCOUNT_OLD, 7),
  ]
}
