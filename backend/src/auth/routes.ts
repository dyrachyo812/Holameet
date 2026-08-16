import type { AuthResponse, LoginRequest, RegisterRequest } from '@holameet/shared'
import { apiRoutes } from '@holameet/shared'
import { Router } from 'express'
import { hashPassword, verifyPassword } from './passwords.js'
import { pool } from '../db.js'
import { sendError } from '../http/sendError.js'
import { toPublicUser, type UserRow } from '../users/mapUser.js'

const usernamePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const authRouter = Router()

authRouter.post(apiRoutes.register, async (request, response) => {
  const body = request.body as RegisterRequest
  const email = body.email?.trim().toLowerCase()
  const username = body.username?.trim().toLowerCase()
  const name = body.name?.trim()
  const password = body.password

  if (
    !emailPattern.test(email ?? '') ||
    !usernamePattern.test(username ?? '') ||
    !name ||
    typeof password !== 'string' ||
    password.length < 8
  ) {
    sendError(response, 400, 'validationError', 'Invalid registration data')
    return
  }

  try {
    const passwordHash = await hashPassword(password)
    const result = await pool.query<UserRow>(
      `INSERT INTO users (email, username, password_hash, name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, name, timezone, working_hours_json, buffer_minutes, created_at`,
      [email, username, passwordHash, name],
    )
    const user = result.rows[0]
    request.session = { userId: user.id }
    const bodyResponse: AuthResponse = { user: toPublicUser(user) }
    response.status(201).json(bodyResponse)
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      sendError(response, 409, 'conflict', 'Email or username already taken')
      return
    }

    sendError(response, 500, 'internalError', 'Registration failed')
  }
})

authRouter.post(apiRoutes.login, async (request, response) => {
  const body = request.body as LoginRequest
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!emailPattern.test(email ?? '') || typeof password !== 'string') {
    sendError(response, 400, 'validationError', 'Invalid login data')
    return
  }

  try {
    const result = await pool.query<UserRow & { password_hash: string }>(
      `SELECT id, email, username, name, timezone, working_hours_json, buffer_minutes, created_at, password_hash
     FROM users WHERE email = $1`,
      [email],
    )
    const user = result.rows[0]

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      sendError(response, 401, 'unauthorized', 'Invalid email or password')
      return
    }

    request.session = { userId: user.id }
    const bodyResponse: AuthResponse = { user: toPublicUser(user) }
    response.json(bodyResponse)
  } catch {
    sendError(response, 500, 'internalError', 'Login failed')
  }
})

authRouter.post(apiRoutes.logout, (request, response) => {
  request.session = null
  response.json({ ok: true })
})
