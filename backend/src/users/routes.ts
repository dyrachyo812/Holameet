import type { MeResponse, UpdateMeRequest } from '@holameet/shared'
import { apiRoutes } from '@holameet/shared'
import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../http/requireAuth.js'
import { sendError } from '../http/sendError.js'
import { toUserProfile, type UserRow } from './mapUser.js'
import { parseWorkingHours } from './parseWorkingHours.js'

export const usersRouter = Router()

usersRouter.get(apiRoutes.me, requireAuth, async (request, response) => {
  try {
    const result = await pool.query<UserRow>(
      `SELECT id, email, username, name, timezone, working_hours_json, buffer_minutes, created_at
     FROM users WHERE id = $1`,
      [request.session?.userId],
    )
    const user = result.rows[0]

    if (!user) {
      request.session = null
      sendError(response, 401, 'unauthorized', 'Unauthorized')
      return
    }

    const body: MeResponse = { user: toUserProfile(user) }
    response.json(body)
  } catch {
    sendError(response, 500, 'internalError', 'Failed to load profile')
  }
})

usersRouter.patch(apiRoutes.me, requireAuth, async (request, response) => {
  const body = request.body as UpdateMeRequest
  const name = body.name?.trim()
  const timezone = body.timezone?.trim()
  const workingHours =
    body.workingHours === undefined
      ? undefined
      : parseWorkingHours(body.workingHours)
  const bufferMinutes = body.bufferMinutes

  if (body.name !== undefined && !name) {
    sendError(response, 400, 'validationError', 'Invalid name')
    return
  }

  if (body.timezone !== undefined && !timezone) {
    sendError(response, 400, 'validationError', 'Invalid timezone')
    return
  }

  if (body.workingHours !== undefined && workingHours === undefined) {
    sendError(response, 400, 'validationError', 'Invalid working hours')
    return
  }

  if (
    bufferMinutes !== undefined &&
    (!Number.isInteger(bufferMinutes) || bufferMinutes < 0)
  ) {
    sendError(response, 400, 'validationError', 'Invalid buffer')
    return
  }

  try {
    const result = await pool.query<UserRow>(
      `UPDATE users SET
       name = COALESCE($2, name),
       timezone = COALESCE($3, timezone),
       working_hours_json = COALESCE($4, working_hours_json),
       buffer_minutes = COALESCE($5, buffer_minutes)
     WHERE id = $1
     RETURNING id, email, username, name, timezone, working_hours_json, buffer_minutes, created_at`,
      [
        request.session?.userId,
        name ?? null,
        timezone ?? null,
        workingHours ?? null,
        bufferMinutes ?? null,
      ],
    )

    const user = result.rows[0]
    const me: MeResponse = { user: toUserProfile(user) }
    response.json(me)
  } catch {
    sendError(response, 500, 'internalError', 'Failed to update profile')
  }
})
