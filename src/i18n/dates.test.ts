import { describe, expect, it } from 'vitest'
import { formatDate, formatTime, monthDay, monthNames, weekdayNames } from './dates'

describe('dates', () => {
  it('English names start on January and on Sunday', () => {
    expect(monthNames('en-US')[0]).toBe('January')
    expect(monthNames('en-US')[8]).toBe('September')
    expect(weekdayNames('en-US')).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
  })
  it('Georgian has 12 months and 7 weekdays written in Georgian letters', () => {
    expect(monthNames('ka-GE')).toHaveLength(12)
    expect(weekdayNames('ka-GE')).toHaveLength(7)
    expect(monthNames('ka-GE')[8]).toBe('სექტემბერი')
    expect(weekdayNames('ka-GE')[0]).toBe('კვი') // Sunday
    for (const w of [...monthNames('ka-GE'), ...weekdayNames('ka-GE')]) expect(/^[Ⴀ-ჿ]+$/.test(w), w).toBe(true)
  })
  it('formats short day and month', () => {
    const d = new Date(2026, 8, 7)
    expect(monthDay(d, 'en-US')).toBe('Sep 7')
    expect(monthDay(d, 'ka-GE')).toBe('7 სექ')
  })
  it('formats numeric dates per language and 24-hour time', () => {
    const iso = new Date(2026, 8, 11, 9, 5).toISOString()
    expect(formatDate(iso, 'en-US')).toBe('09/11/2026')
    expect(formatDate(iso, 'ka-GE')).toBe('11.09.2026')
    expect(formatTime(iso)).toBe('09:05')
  })
})
