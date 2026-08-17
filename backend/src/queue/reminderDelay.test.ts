import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'
import { parseReminderOffsets, reminderDelayMs } from './reminderDelay.js'

describe('parseReminderOffsets', () => {
  it('defaults to 24h and 1h', () => {
    expect(parseReminderOffsets(undefined)).toEqual([1440, 60])
  })

  it('deduplicates and sorts descending', () => {
    expect(parseReminderOffsets('60, 2, 60')).toEqual([60, 2])
  })
})

describe('reminderDelayMs', () => {
  const now = DateTime.fromISO('2026-08-17T10:00:00Z')

  it('schedules at start minus offset when that instant is in the future', () => {
    const start = now.plus({ hours: 3 })
    expect(reminderDelayMs(start, 60, now, 60)).toBe(2 * 60 * 60 * 1000)
    expect(reminderDelayMs(start, 1440, now, 60)).toBeNull()
  })

  it('catch-up the smallest offset within two minutes if the meeting is sooner', () => {
    const start = now.plus({ minutes: 10 })
    expect(reminderDelayMs(start, 60, now, 60)).toBe(120_000)
    expect(reminderDelayMs(start, 1440, now, 60)).toBeNull()
  })

  it('does not schedule after the meeting has started', () => {
    const start = now.minus({ minutes: 1 })
    expect(reminderDelayMs(start, 60, now, 60)).toBeNull()
  })
})
