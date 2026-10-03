import { describe, expect, it } from 'vitest'
import { addDays, addWeeks, formatWeek, inWeek, weekStartOf } from './weeks'

describe('weeks', () => {
  it('finds the Monday of any day (2026-09-07 is a Monday)', () => {
    expect(weekStartOf(new Date(2026, 8, 7))).toBe('2026-09-07')
    expect(weekStartOf(new Date(2026, 8, 10))).toBe('2026-09-07')
    expect(weekStartOf(new Date(2026, 8, 13))).toBe('2026-09-07') // Sunday belongs to the week that began Monday
    expect(weekStartOf(new Date(2026, 8, 14))).toBe('2026-09-14')
  })
  it('adds days and weeks across month and year ends', () => {
    expect(addDays('2026-09-28', 5)).toBe('2026-10-03')
    expect(addWeeks('2026-12-28', 1)).toBe('2027-01-04')
    expect(addWeeks('2026-09-07', -1)).toBe('2026-08-31')
  })
  it('checks whether a day is inside a week, ends included', () => {
    expect(inWeek('2026-09-07', '2026-09-07')).toBe(true)
    expect(inWeek('2026-09-13', '2026-09-07')).toBe(true)
    expect(inWeek('2026-09-14', '2026-09-07')).toBe(false)
    expect(inWeek('2026-09-06', '2026-09-07')).toBe(false)
  })
  it('formats a week range', () => {
    expect(formatWeek('2026-09-07')).toBe('Sep 7 – Sep 13, 2026')
  })
})
