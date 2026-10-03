import type { Direction } from './types'

/**
 * Gross P&L from prices. `pointValues` maps a symbol code to dollars per point (managed on the Admin page).
 * Returns null when the symbol is unknown or a price is missing.
 */
export function pnlFromPrices(
  pointValues: Record<string, number>,
  symbol: string,
  direction: Direction,
  qty: number,
  entry: number | null,
  exit: number | null,
): number | null {
  const pointValue = pointValues[symbol]
  if (pointValue === undefined || entry === null || exit === null) return null
  const points = direction === 'long' ? exit - entry : entry - exit
  return Math.round(points * pointValue * qty * 100) / 100
}
