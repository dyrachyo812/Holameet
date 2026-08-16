import type { WorkingHours } from '@holameet/shared'
import { DateTime } from 'luxon'
import { pool } from '../db.js'
import { buildSlots } from '../availability/buildSlots.js'

export type PublicEventRow = {
  eventTypeId: string
  title: string
  slug: string
  durationMinutes: number
  isActive: boolean
  organizerName: string
  username: string
  timezone: string
  workingHours: WorkingHours | null
  bufferMinutes: number
}

export async function findPublicEvent(username: string, eventSlug: string) {
  const result = await pool.query<{
    event_type_id: string
    title: string
    slug: string
    duration_minutes: number
    is_active: boolean
    organizer_name: string
    username: string
    timezone: string
    working_hours_json: WorkingHours | null
    buffer_minutes: number
  }>(
    `SELECT
       event_types.id AS event_type_id,
       event_types.title,
       event_types.slug,
       event_types.duration_minutes,
       event_types.is_active,
       users.name AS organizer_name,
       users.username,
       users.timezone,
       users.working_hours_json,
       users.buffer_minutes
     FROM event_types
     JOIN users ON users.id = event_types.user_id
     WHERE users.username = $1 AND event_types.slug = $2`,
    [username, eventSlug],
  )
  const row = result.rows[0]
  if (!row || !row.is_active) {
    return null
  }

  return {
    eventTypeId: row.event_type_id,
    title: row.title,
    slug: row.slug,
    durationMinutes: row.duration_minutes,
    isActive: row.is_active,
    organizerName: row.organizer_name,
    username: row.username,
    timezone: row.timezone,
    workingHours: row.working_hours_json,
    bufferMinutes: row.buffer_minutes,
  } satisfies PublicEventRow
}

export async function loadOccupied(eventTypeId: string) {
  const result = await pool.query<{ start_time_utc: Date; end_time_utc: Date }>(
    `SELECT start_time_utc, end_time_utc
     FROM bookings
     WHERE event_type_id = $1 AND status = 'confirmed'`,
    [eventTypeId],
  )

  return result.rows.map((row) => ({
    startUtc: DateTime.fromJSDate(row.start_time_utc, { zone: 'utc' }),
    endUtc: DateTime.fromJSDate(row.end_time_utc, { zone: 'utc' }),
  }))
}

export async function listOpenSlots(event: PublicEventRow, fromDate: string, toDate: string) {
  const occupied = await loadOccupied(event.eventTypeId)
  return buildSlots({
    timeZone: event.timezone,
    workingHours: event.workingHours,
    durationMinutes: event.durationMinutes,
    bufferMinutes: event.bufferMinutes,
    fromDate,
    toDate,
    occupied,
    nowUtc: DateTime.utc(),
  })
}
