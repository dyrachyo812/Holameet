import type {
  CalendarConnectResponse,
  CalendarDisconnectResponse,
  CalendarStatusResponse,
} from '@holameet/shared'
import { apiRoutes } from '@holameet/shared'
import { Router } from 'express'
import crypto from 'node:crypto'
import { pool } from '../db.js'
import { decryptToken, encryptToken } from '../crypto/tokenCipher.js'
import { requireAuth } from '../http/requireAuth.js'
import { sendError } from '../http/sendError.js'
import { createGoogleClient, googleAuthUrl, googleEnv } from './googleClient.js'

export const calendarRouter = Router()

function appOrigin() {
  return process.env.APP_ORIGIN ?? 'http://localhost:5173'
}

calendarRouter.get(apiRoutes.calendar, requireAuth, async (request, response) => {
  try {
    const result = await pool.query<{
      provider: 'google'
      expires_at: Date
      is_valid: boolean
    }>(
      `SELECT provider, expires_at, is_valid
     FROM calendar_connections
     WHERE user_id = $1 AND provider = 'google'`,
      [request.session?.userId],
    )
    const row = result.rows[0]
    const body: CalendarStatusResponse = row
      ? {
          connected: true,
          provider: row.provider,
          isValid: row.is_valid,
          expiresAt: row.expires_at.toISOString(),
        }
      : {
          connected: false,
          provider: null,
          isValid: false,
          expiresAt: null,
        }
    response.json(body)
  } catch {
    sendError(response, 500, 'internalError', 'Failed to load calendar')
  }
})

calendarRouter.post(apiRoutes.calendarConnect, requireAuth, (request, response) => {
  const env = googleEnv()
  const client = createGoogleClient()
  if (!env || !client || !request.session?.userId) {
    sendError(response, 500, 'internalError', 'Google Calendar is not configured')
    return
  }

  const nonce = crypto.randomBytes(16).toString('hex')
  request.session = { userId: request.session.userId, oauthNonce: nonce }
  const state = `${request.session.userId}.${nonce}`
  const body: CalendarConnectResponse = {
    authorizationUrl: googleAuthUrl(client, state),
  }
  response.json(body)
})

calendarRouter.get(apiRoutes.calendarCallback, async (request, response) => {
  const origin = appOrigin()
  if (request.query.error === 'access_denied') {
    response.redirect(`${origin}/?calendar=denied`)
    return
  }

  const code = String(request.query.code ?? '')
  const state = String(request.query.state ?? '')
  const [userId, nonce] = state.split('.')
  if (
    !code ||
    !userId ||
    !nonce ||
    request.session?.userId !== userId ||
    request.session?.oauthNonce !== nonce
  ) {
    response.redirect(`${origin}/?calendar=error`)
    return
  }

  const client = createGoogleClient()
  if (!client) {
    response.redirect(`${origin}/?calendar=error`)
    return
  }

  try {
    const tokenResponse = await client.getToken(code)
    const accessToken = tokenResponse.tokens.access_token
    const refreshToken = tokenResponse.tokens.refresh_token
    const expiry = tokenResponse.tokens.expiry_date
    if (!accessToken || !refreshToken || !expiry) {
      response.redirect(`${origin}/?calendar=error`)
      return
    }

    await pool.query(
      `INSERT INTO calendar_connections (
         user_id, provider, access_token_encrypted, refresh_token_encrypted, expires_at, is_valid
       ) VALUES ($1, 'google', $2, $3, $4, true)
       ON CONFLICT (user_id, provider) DO UPDATE SET
         access_token_encrypted = EXCLUDED.access_token_encrypted,
         refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
         expires_at = EXCLUDED.expires_at,
         is_valid = true`,
      [userId, encryptToken(accessToken), encryptToken(refreshToken), new Date(expiry)],
    )
    request.session = { userId }
    response.redirect(`${origin}/?calendar=connected`)
  } catch {
    response.redirect(`${origin}/?calendar=error`)
  }
})

calendarRouter.post(apiRoutes.calendarDisconnect, requireAuth, async (request, response) => {
  try {
    const result = await pool.query<{ refresh_token_encrypted: string }>(
      `DELETE FROM calendar_connections
     WHERE user_id = $1 AND provider = 'google'
     RETURNING refresh_token_encrypted`,
      [request.session?.userId],
    )
    const row = result.rows[0]
    if (row) {
      try {
        const token = decryptToken(row.refresh_token_encrypted)
        await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ token }),
        })
      } catch {
        return
      }
    }

    const body: CalendarDisconnectResponse = { ok: true }
    response.json(body)
  } catch {
    sendError(response, 500, 'internalError', 'Failed to disconnect calendar')
  }
})
