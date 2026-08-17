import type { StatsResponse } from '@holameet/shared'
import { apiRoutes } from '@holameet/shared'
import { Router } from 'express'
import { DateTime } from 'luxon'
import { pool } from '../db.js'
import { requireAuth } from '../http/requireAuth.js'
import { sendError } from '../http/sendError.js'

const maxRangeDays = 366
const datePattern = /^\d{4}-\d{2}-\d{2}$/

export const statsRouter = Router()

statsRouter.get(apiRoutes.stats, requireAuth, async (request, response) => {
  const fromDate = String(request.query.from ?? '')
  const toDate = String(request.query.to ?? '')
  if (!datePattern.test(fromDate) || !datePattern.test(toDate)) {
    sendError(response, 400, 'validationError', 'Invalid date range')
    return
  }

  try {
    const user = await pool.query<{ timezone: string }>(
      `SELECT timezone FROM users WHERE id = $1`,
      [request.session?.userId],
    )
    const timeZone = user.rows[0]?.timezone
    if (!timeZone) {
      sendError(response, 401, 'unauthorized', 'Unauthorized')
      return
    }

    const from = DateTime.fromISO(fromDate, { zone: timeZone }).startOf('day')
    const toExclusive = DateTime.fromISO(toDate, { zone: timeZone })
      .plus({ days: 1 })
      .startOf('day')

    if (!from.isValid || !toExclusive.isValid || toExclusive <= from) {
      sendError(response, 400, 'validationError', 'Invalid date range')
      return
    }

    if (toExclusive.diff(from, 'days').days > maxRangeDays) {
      sendError(response, 400, 'validationError', 'Invalid date range')
      return
    }

    const result = await pool.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count
       FROM bookings
       JOIN event_types ON event_types.id = bookings.event_type_id
       WHERE event_types.user_id = $1
         AND bookings.status = 'confirmed'
         AND bookings.start_time_utc >= $2
         AND bookings.start_time_utc < $3`,
      [request.session?.userId, from.toUTC().toISO(), toExclusive.toUTC().toISO()],
    )

    const body: StatsResponse = {
      bookingsCount: result.rows[0]?.count ?? 0,
      from: fromDate,
      to: toDate,
    }
    response.json(body)
  } catch {
    sendError(response, 500, 'internalError', 'Failed to load stats')
  }
})
