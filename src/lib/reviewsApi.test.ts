import { describe, expect, it } from 'vitest'
import { emptyReview, isReviewEmpty } from './reviewsApi'

describe('isReviewEmpty', () => {
  it('is true for a fresh review and for whitespace only', () => {
    expect(isReviewEmpty(emptyReview('2026-09-07'))).toBe(true)
    expect(isReviewEmpty({ ...emptyReview('2026-09-07'), mistakes: '  \n ' })).toBe(true)
  })
  it('is false as soon as any field or the bias has content', () => {
    expect(isReviewEmpty({ ...emptyReview('2026-09-07'), plan: 'no revenge trades' })).toBe(false)
    expect(isReviewEmpty({ ...emptyReview('2026-09-07'), bias: 'bullish' })).toBe(false)
  })
})
