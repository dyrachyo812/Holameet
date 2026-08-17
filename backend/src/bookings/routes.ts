import type { BookingListResponse } from '@holameet/shared'
import { apiRoutes } from '@holameet/shared'
import { Router } from 'express'
import { DateTime } from 'luxon'
import { pool } from '../db.js'
import { requireAuth } from '../http/requireAuth.js'
import { sendError } from '../http/sendError.js'

type BookingRow = {
  id: string
  event_type_id: string
  event_type_title: string
  invitee_name: string
  invitee_email: string
  invitee_tz: string
  start_time_utc: Date
  end_time_utc: Date
  status: 'confirmed' | 'cancelled'
  calendar_event_id: string | null
  created_at: Date
}

function toIso(value: Date) {
  return DateTime.fromJSDate(value, { zone: 'utc' }).toISO() ?? ''
}

function parseBound(value: unknown) {
  if (typeof value !== 'string' || !value) {
    return undefined
  }

  const parsed = DateTime.fromISO(value, { zone: 'utc' })
  if (!parsed.isValid) {
    return null
  }

  return parsed
}

export const bookingsRouter = Router()

bookingsRouter.get(apiRoutes.bookings, requireAuth, async (request, response) => {
  const from = parseBound(request.query.from)
  const to = parseBound(request.query.to)

  if (from === null || to === null) {
    sendError(response, 400, 'validationError', 'Invalid date range')
    return
  }

  try {
    const result = await pool.query<BookingRow>(
      `SELECT
         bookings.id,
         bookings.event_type_id,
         event_types.title AS event_type_title,
         bookings.invitee_name,
         bookings.invitee_email,
         bookings.invitee_tz,
         bookings.start_time_utc,
         bookings.end_time_utc,
         bookings.status,
         bookings.calendar_event_id,
         bookings.created_at
       FROM bookings
       JOIN event_types ON event_types.id = bookings.event_type_id
       WHERE event_types.user_id = $1
         AND bookings.status = 'confirmed'
         AND bookings.start_time_utc >= COALESCE($2::timestamptz, now())
         AND ($3::timestamptz IS NULL OR bookings.start_time_utc < $3::timestamptz)
       ORDER BY bookings.start_time_utc ASC
       LIMIT 100`,
      [
        request.session?.userId,
        from?.toUTC().toISO() ?? null,
        to?.toUTC().toISO() ?? null,
      ],
    )
    const body: BookingListResponse = {
      bookings: result.rows.map((row) => ({
        id: row.id,
        eventTypeId: row.event_type_id,
        eventTypeTitle: row.event_type_title,
        inviteeName: row.invitee_name,
        inviteeEmail: row.invitee_email,
        inviteeTz: row.invitee_tz,
        startTimeUtc: toIso(row.start_time_utc),
        endTimeUtc: toIso(row.end_time_utc),
        status: row.status,
        calendarEventId: row.calendar_event_id,
        createdAt: toIso(row.created_at),
      })),
    }
    response.json(body)
  } catch {
    sendError(response, 500, 'internalError', 'Failed to load bookings')
  }
})
