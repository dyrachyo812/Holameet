import type { Weekday, WorkingHours } from '@holameet/shared'
import { DateTime } from 'luxon'

const weekdayKeys: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export type OccupiedRange = {
  startUtc: DateTime
  endUtc: DateTime
}

export type BuildSlotsInput = {
  timeZone: string
  workingHours: WorkingHours | null
  durationMinutes: number
  bufferMinutes: number
  fromDate: string
  toDate: string
  occupied: OccupiedRange[]
  nowUtc: DateTime
}

export type BuiltSlot = {
  startUtc: DateTime
  endUtc: DateTime
}

function weekdayKey(date: DateTime): Weekday {
  return weekdayKeys[date.weekday - 1]
}

function rangesOverlap(
  startA: DateTime,
  endA: DateTime,
  startB: DateTime,
  endB: DateTime,
) {
  return startA < endB && endA > startB
}

export function buildSlots(input: BuildSlotsInput): BuiltSlot[] {
  if (!input.workingHours) {
    return []
  }

  const from = DateTime.fromISO(input.fromDate, { zone: input.timeZone }).startOf(
    'day',
  )
  const to = DateTime.fromISO(input.toDate, { zone: input.timeZone }).startOf('day')

  if (!from.isValid || !to.isValid || to < from) {
    return []
  }

  const slots: BuiltSlot[] = []
  const occupied = input.occupied.map((range) => ({
    startUtc: range.startUtc.toUTC(),
    endUtc: range.endUtc.plus({ minutes: input.bufferMinutes }).toUTC(),
  }))

  for (
    let day = from;
    day <= to;
    day = day.plus({ days: 1 })
  ) {
    const intervals = input.workingHours[weekdayKey(day)] ?? []

    for (const interval of intervals) {
      let cursor = DateTime.fromISO(`${day.toISODate()}T${interval.start}`, {
        zone: input.timeZone,
      })
      const windowEnd = DateTime.fromISO(`${day.toISODate()}T${interval.end}`, {
        zone: input.timeZone,
      })

      if (!cursor.isValid || !windowEnd.isValid) {
        continue
      }

      while (
        cursor.plus({ minutes: input.durationMinutes }) <= windowEnd
      ) {
        const startUtc = cursor.toUTC()
        const endUtc = cursor.plus({ minutes: input.durationMinutes }).toUTC()
        const isFuture = startUtc > input.nowUtc.toUTC()
        const isFree = occupied.every(
          (range) => !rangesOverlap(startUtc, endUtc, range.startUtc, range.endUtc),
        )

        if (isFuture && isFree) {
          slots.push({ startUtc, endUtc })
        }

        cursor = cursor.plus({
          minutes: input.durationMinutes + input.bufferMinutes,
        })
      }
    }
  }

  return slots
}
