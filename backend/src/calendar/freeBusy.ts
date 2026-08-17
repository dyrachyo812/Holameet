import { DateTime } from 'luxon'
import { pool } from '../db.js'
import { decryptToken, encryptToken } from '../crypto/tokenCipher.js'
import { createGoogleClient } from './googleClient.js'
import type { OccupiedRange } from '../availability/buildSlots.js'

type ConnectionRow = {
  id: string
  access_token_encrypted: string
  refresh_token_encrypted: string
  expires_at: Date
  is_valid: boolean
}

export class CalendarRevokedError extends Error {
  constructor() {
    super('calendarDisconnected')
    this.name = 'CalendarRevokedError'
  }
}

async function loadConnection(userId: string) {
  const result = await pool.query<ConnectionRow>(
    `SELECT id, access_token_encrypted, refresh_token_encrypted, expires_at, is_valid
     FROM calendar_connections
     WHERE user_id = $1 AND provider = 'google'`,
    [userId],
  )
  return result.rows[0] ?? null
}

async function markInvalid(connectionId: string) {
  await pool.query(
    `UPDATE calendar_connections SET is_valid = false WHERE id = $1`,
    [connectionId],
  )
}

function isRevoked(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  const record = error as { code?: number; response?: { status?: number; data?: { error?: string } } }
  const status = record.code ?? record.response?.status
  const googleError = record.response?.data?.error
  return status === 401 || status === 403 || googleError === 'invalid_grant'
}

export async function accessTokenForUser(userId: string) {
  const connection = await loadConnection(userId)
  if (!connection || !connection.is_valid) {
    return null
  }

  const client = createGoogleClient()
  if (!client) {
    return null
  }

  try {
    client.setCredentials({
      access_token: decryptToken(connection.access_token_encrypted),
      refresh_token: decryptToken(connection.refresh_token_encrypted),
      expiry_date: connection.expires_at.getTime(),
    })
    const token = await client.getAccessToken()
    if (!token.token) {
      throw new CalendarRevokedError()
    }

    const expiry = client.credentials.expiry_date
    if (expiry && expiry !== connection.expires_at.getTime()) {
      await pool.query(
        `UPDATE calendar_connections
         SET access_token_encrypted = $2, expires_at = $3
         WHERE id = $1`,
        [connection.id, encryptToken(token.token), new Date(expiry)],
      )
    }

    return token.token
  } catch (error) {
    if (error instanceof CalendarRevokedError || isRevoked(error)) {
      await markInvalid(connection.id)
      return null
    }

    return null
  }
}

type FreeBusyResponse = {
  calendars?: {
    primary?: {
      busy?: { start: string; end: string }[]
    }
  }
}

export async function loadGoogleBusy(
  userId: string,
  fromDate: string,
  toDate: string,
  timeZone: string,
): Promise<OccupiedRange[]> {
  const accessToken = await accessTokenForUser(userId)
  if (!accessToken) {
    return []
  }

  const timeMin = DateTime.fromISO(fromDate, { zone: timeZone }).startOf('day').toUTC().toISO()
  const timeMax = DateTime.fromISO(toDate, { zone: timeZone }).endOf('day').toUTC().toISO()
  if (!timeMin || !timeMax) {
    return []
  }

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: [{ id: 'primary' }],
      }),
    })

    if (response.status === 401 || response.status === 403) {
      const connection = await loadConnection(userId)
      if (connection) {
        await markInvalid(connection.id)
      }
      return []
    }

    if (!response.ok) {
      return []
    }

    const body = (await response.json()) as FreeBusyResponse
    const busy = body.calendars?.primary?.busy ?? []
    return busy.flatMap((range) => {
      const startUtc = DateTime.fromISO(range.start, { zone: 'utc' })
      const endUtc = DateTime.fromISO(range.end, { zone: 'utc' })
      if (!startUtc.isValid || !endUtc.isValid) {
        return []
      }

      return [{ startUtc, endUtc }]
    })
  } catch {
    return []
  }
}
