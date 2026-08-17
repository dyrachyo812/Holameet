import { DateTime } from 'luxon'

export function parseReminderOffsets(value: string | undefined) {
  const raw = value ?? '1440,60'
  const parsed = raw
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((minutes) => Number.isInteger(minutes) && minutes > 0)
  return [...new Set(parsed)].sort((left, right) => right - left)
}

export function reminderDelayMs(
  startUtc: DateTime,
  offsetMinutes: number,
  nowUtc: DateTime,
  smallestOffset: number,
) {
  const fireAt = startUtc.minus({ minutes: offsetMinutes })
  const untilFire = fireAt.diff(nowUtc).as('milliseconds')
  if (untilFire > 5000) {
    return Math.floor(untilFire)
  }

  const untilStart = startUtc.diff(nowUtc).as('milliseconds')
  if (untilStart <= 5000 || offsetMinutes !== smallestOffset) {
    return null
  }

  return Math.min(120_000, Math.max(5000, Math.floor(untilStart - 5000)))
}
