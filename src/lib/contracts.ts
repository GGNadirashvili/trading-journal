import type { Direction } from './types'

// Dollar value of one full price point, per contract.
export const POINT_VALUE: Record<string, number> = {
  MNQ: 2,
  NQ: 20,
  ES: 50,
  MES: 5,
}

/** Gross P&L from prices, or null when the symbol is unknown or a price is missing. */
export function pnlFromPrices(
  symbol: string,
  direction: Direction,
  qty: number,
  entry: number | null,
  exit: number | null,
): number | null {
  const pointValue = POINT_VALUE[symbol]
  if (pointValue === undefined || entry === null || exit === null) return null
  const points = direction === 'long' ? exit - entry : entry - exit
  return Math.round(points * pointValue * qty * 100) / 100
}
