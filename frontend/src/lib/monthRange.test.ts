import { describe, expect, it } from 'vitest'
import { calendarMonthBounds, firstOfMonthFromYm, ymFromFullMonthRange } from './monthRange'

describe('monthRange', () => {
  it('firstOfMonthFromYm matches calendar month start', () => {
    expect(firstOfMonthFromYm('2026-04')).toBe('2026-04-01')
  })

  it('calendarMonthBounds covers April length', () => {
    expect(calendarMonthBounds('2026-04')).toEqual({ from: '2026-04-01', to: '2026-04-30' })
  })

  it('ymFromFullMonthRange only when a single full month', () => {
    expect(ymFromFullMonthRange('2026-04-01', '2026-04-30')).toBe('2026-04')
    expect(ymFromFullMonthRange('2026-04-01', '2026-05-01')).toBe('')
  })
})
