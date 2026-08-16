import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'
import { buildSlots } from './buildSlots.js'
import type { WorkingHours } from '@holameet/shared'

const weekdayHours: WorkingHours = {
  monday: [{ start: '09:00', end: '12:00' }],
  tuesday: [{ start: '09:00', end: '12:00' }],
  wednesday: [{ start: '09:00', end: '12:00' }],
  thursday: [{ start: '09:00', end: '12:00' }],
  friday: [{ start: '09:00', end: '12:00' }],
  saturday: [],
  sunday: [{ start: '01:00', end: '05:00' }],
}

describe('buildSlots DST', () => {
  it('maps Kyiv 10:00 to UTC+2 before spring-forward and UTC+3 after', () => {
    const now = DateTime.fromISO('2026-03-01T00:00:00Z')
    const before = buildSlots({
      timeZone: 'Europe/Kyiv',
      workingHours: weekdayHours,
      durationMinutes: 60,
      bufferMinutes: 0,
      fromDate: '2026-03-27',
      toDate: '2026-03-27',
      occupied: [],
      nowUtc: now,
    })
    const after = buildSlots({
      timeZone: 'Europe/Kyiv',
      workingHours: weekdayHours,
      durationMinutes: 60,
      bufferMinutes: 0,
      fromDate: '2026-03-30',
      toDate: '2026-03-30',
      occupied: [],
      nowUtc: now,
    })

    expect(before[1]?.startUtc.toISO()).toBe('2026-03-27T08:00:00.000Z')
    expect(after[1]?.startUtc.toISO()).toBe('2026-03-30T07:00:00.000Z')
  })

  it('maps New York 10:00 to UTC-5 before spring-forward and UTC-4 after', () => {
    const hours: WorkingHours = {
      ...weekdayHours,
      saturday: [{ start: '09:00', end: '12:00' }],
      monday: [{ start: '09:00', end: '12:00' }],
    }
    const now = DateTime.fromISO('2026-03-01T00:00:00Z')
    const before = buildSlots({
      timeZone: 'America/New_York',
      workingHours: hours,
      durationMinutes: 60,
      bufferMinutes: 0,
      fromDate: '2026-03-07',
      toDate: '2026-03-07',
      occupied: [],
      nowUtc: now,
    })
    const after = buildSlots({
      timeZone: 'America/New_York',
      workingHours: hours,
      durationMinutes: 60,
      bufferMinutes: 0,
      fromDate: '2026-03-09',
      toDate: '2026-03-09',
      occupied: [],
      nowUtc: now,
    })

    expect(before[1]?.startUtc.toISO()).toBe('2026-03-07T15:00:00.000Z')
    expect(after[1]?.startUtc.toISO()).toBe('2026-03-09T14:00:00.000Z')
  })

  it('skips the missing Kyiv hour on spring-forward Sunday', () => {
    const now = DateTime.fromISO('2026-03-01T00:00:00Z')
    const slots = buildSlots({
      timeZone: 'Europe/Kyiv',
      workingHours: weekdayHours,
      durationMinutes: 60,
      bufferMinutes: 0,
      fromDate: '2026-03-29',
      toDate: '2026-03-29',
      occupied: [],
      nowUtc: now,
    })
    const hours = slots.map((slot) => slot.startUtc.setZone('Europe/Kyiv').toFormat('HH:mm'))

    expect(hours).not.toContain('03:00')
    expect(hours).toEqual(['01:00', '02:00', '04:00'])
  })
})

describe('buildSlots occupancy', () => {
  it('hides a slot that overlaps a confirmed booking including buffer', () => {
    const now = DateTime.fromISO('2026-04-01T00:00:00Z')
    const slots = buildSlots({
      timeZone: 'Europe/Kyiv',
      workingHours: weekdayHours,
      durationMinutes: 30,
      bufferMinutes: 15,
      fromDate: '2026-04-03',
      toDate: '2026-04-03',
      occupied: [
        {
          startUtc: DateTime.fromISO('2026-04-03T06:00:00Z'),
          endUtc: DateTime.fromISO('2026-04-03T06:30:00Z'),
        },
      ],
      nowUtc: now,
    })
    const starts = slots.map((slot) => slot.startUtc.toISO())

    expect(starts).not.toContain('2026-04-03T06:00:00.000Z')
    expect(starts).not.toContain('2026-04-03T06:30:00.000Z')
    expect(starts).toContain('2026-04-03T06:45:00.000Z')
  })
})
