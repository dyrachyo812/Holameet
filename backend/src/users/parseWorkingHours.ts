import type { Weekday, WorkingHours, WorkingHoursInterval } from '@holameet/shared'

const weekdays: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/

function parseMinutes(value: string) {
  const match = timePattern.exec(value)
  if (!match) {
    return null
  }

  return Number(match[1]) * 60 + Number(match[2])
}

function isInterval(value: unknown): value is WorkingHoursInterval {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const interval = value as WorkingHoursInterval
  const start = parseMinutes(interval.start)
  const end = parseMinutes(interval.end)
  return start !== null && end !== null && start < end
}

export function parseWorkingHours(value: unknown): WorkingHours | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined
  }

  const record = value as Record<string, unknown>
  const hours = {} as WorkingHours

  for (const day of weekdays) {
    const intervals = record[day]
    if (!Array.isArray(intervals) || !intervals.every(isInterval)) {
      return undefined
    }

    hours[day] = intervals
  }

  return hours
}
