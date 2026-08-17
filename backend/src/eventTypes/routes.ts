import type {
  CreateEventTypeRequest,
  EventTypeListResponse,
  EventTypeResponse,
  UpdateEventTypeRequest,
} from '@holameet/shared'
import { apiRoutes } from '@holameet/shared'
import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../http/requireAuth.js'
import { sendError } from '../http/sendError.js'
import { toEventType, type EventTypeRow } from './mapEventType.js'
import { parseDuration, parseSlug, parseTitle } from './parseEventType.js'

export const eventTypesRouter = Router()

function isUniqueViolation(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  )
}

eventTypesRouter.get(apiRoutes.eventTypes, requireAuth, async (request, response) => {
  try {
    const result = await pool.query<EventTypeRow>(
      `SELECT id, title, slug, duration_minutes, is_active
       FROM event_types
       WHERE user_id = $1
       ORDER BY title`,
      [request.session?.userId],
    )
    const body: EventTypeListResponse = {
      eventTypes: result.rows.map(toEventType),
    }
    response.json(body)
  } catch {
    sendError(response, 500, 'internalError', 'Failed to load event types')
  }
})

eventTypesRouter.post(apiRoutes.eventTypes, requireAuth, async (request, response) => {
  const body = request.body as CreateEventTypeRequest
  const title = parseTitle(body.title)
  const slug = parseSlug(body.slug)
  const durationMinutes = parseDuration(body.durationMinutes)

  if (!title || !slug || durationMinutes === undefined) {
    sendError(response, 400, 'validationError', 'Invalid event type')
    return
  }

  try {
    const result = await pool.query<EventTypeRow>(
      `INSERT INTO event_types (user_id, title, slug, duration_minutes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, slug, duration_minutes, is_active`,
      [request.session?.userId, title, slug, durationMinutes],
    )
    const row = result.rows[0]
    if (!row) {
      sendError(response, 500, 'internalError', 'Failed to create event type')
      return
    }

    const payload: EventTypeResponse = { eventType: toEventType(row) }
    response.status(201).json(payload)
  } catch (error) {
    if (isUniqueViolation(error)) {
      sendError(response, 409, 'conflict', 'Slug already exists')
      return
    }

    sendError(response, 500, 'internalError', 'Failed to create event type')
  }
})

eventTypesRouter.patch(apiRoutes.eventType, requireAuth, async (request, response) => {
  const body = request.body as UpdateEventTypeRequest
  const title = body.title === undefined ? undefined : parseTitle(body.title)
  const slug = body.slug === undefined ? undefined : parseSlug(body.slug)
  const durationMinutes =
    body.durationMinutes === undefined ? undefined : parseDuration(body.durationMinutes)
  const isActive = body.isActive

  if (body.title !== undefined && !title) {
    sendError(response, 400, 'validationError', 'Invalid event type')
    return
  }

  if (body.slug !== undefined && !slug) {
    sendError(response, 400, 'validationError', 'Invalid event type')
    return
  }

  if (body.durationMinutes !== undefined && durationMinutes === undefined) {
    sendError(response, 400, 'validationError', 'Invalid event type')
    return
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    sendError(response, 400, 'validationError', 'Invalid event type')
    return
  }

  try {
    const result = await pool.query<EventTypeRow>(
      `UPDATE event_types SET
         title = COALESCE($3, title),
         slug = COALESCE($4, slug),
         duration_minutes = COALESCE($5, duration_minutes),
         is_active = COALESCE($6, is_active)
       WHERE id = $1 AND user_id = $2
       RETURNING id, title, slug, duration_minutes, is_active`,
      [
        String(request.params.eventTypeId),
        request.session?.userId,
        title ?? null,
        slug ?? null,
        durationMinutes ?? null,
        isActive ?? null,
      ],
    )
    const row = result.rows[0]
    if (!row) {
      sendError(response, 404, 'notFound', 'Event type not found')
      return
    }

    const payload: EventTypeResponse = { eventType: toEventType(row) }
    response.json(payload)
  } catch (error) {
    if (isUniqueViolation(error)) {
      sendError(response, 409, 'conflict', 'Slug already exists')
      return
    }

    sendError(response, 500, 'internalError', 'Failed to update event type')
  }
})
