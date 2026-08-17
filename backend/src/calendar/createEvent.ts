import { DateTime } from 'luxon'
import { accessTokenForUser } from './freeBusy.js'
import { pool } from '../db.js'

type EventPayload = {
  summary: string
  description: string
  start: { dateTime: string; timeZone: 'UTC' }
  end: { dateTime: string; timeZone: 'UTC' }
  attendees?: { email: string; displayName: string }[]
}

async function postEvent(accessToken: string, payload: EventPayload) {
  return fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=none',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )
}

export async function createGoogleEvent(input: {
  userId: string
  bookingId: string
  title: string
  inviteeName: string
  inviteeEmail: string
  startTimeUtc: DateTime
  endTimeUtc: DateTime
}) {
  try {
    const accessToken = await accessTokenForUser(input.userId)
    if (!accessToken) {
      return null
    }

    const start = input.startTimeUtc.toUTC().toISO()
    const end = input.endTimeUtc.toUTC().toISO()
    if (!start || !end) {
      return null
    }

    const base: EventPayload = {
      summary: input.title,
      description: `${input.inviteeName}\n${input.inviteeEmail}`,
      start: { dateTime: start, timeZone: 'UTC' },
      end: { dateTime: end, timeZone: 'UTC' },
    }

    let response = await postEvent(accessToken, {
      ...base,
      attendees: [{ email: input.inviteeEmail, displayName: input.inviteeName }],
    })
    if (!response.ok) {
      response = await postEvent(accessToken, base)
    }
    if (!response.ok) {
      return null
    }

    const body = (await response.json()) as { id?: string }
    if (!body.id) {
      return null
    }

    await pool.query(`UPDATE bookings SET calendar_event_id = $2 WHERE id = $1`, [
      input.bookingId,
      body.id,
    ])
    return body.id
  } catch {
    return null
  }
}
