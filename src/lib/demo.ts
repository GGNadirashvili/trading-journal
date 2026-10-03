import type { Trade } from './types'

// Dev-only sample data so the UI can be checked before Supabase exists.
// Enabled with VITE_DEMO=1 in `npm run dev`; the production build never includes it.
export const DEMO = import.meta.env.DEV && import.meta.env.VITE_DEMO === '1'

export function demoTrades(): Trade[] {
  const base = (id: string, day: number, hour: number, symbol: string, direction: 'long' | 'short', pnl: number): Trade => ({
    id,
    symbol,
    direction,
    qty: 1,
    entryPrice: null,
    exitPrice: null,
    entryTime: new Date(2026, 8, day, hour, 30).toISOString(),
    exitTime: new Date(2026, 8, day, hour, 50).toISOString(),
    status: 'closed',
    pnl,
    fees: 1.5,
    setup: null,
    tags: [],
    emotionBefore: 'calm',
    emotionAfter: pnl < 0 ? 'frustrated' : 'confident',
    emotionTags: [pnl < 0 ? 'frustrated' : 'confident'],
    notes: null,
  })
  return [
    base('d1', 7, 9, 'MNQ', 'long', 119.2),
    base('d2', 7, 10, 'MNQ', 'short', -111.8),
    base('d3', 8, 9, 'ES', 'long', 212.5),
    base('d4', 9, 10, 'MNQ', 'long', -286.2),
    base('d5', 9, 11, 'MNQ', 'long', -175.8),
    base('d6', 10, 9, 'ES', 'short', 85.9),
    base('d7', 11, 9, 'MNQ', 'short', 64.1),
  ]
}
