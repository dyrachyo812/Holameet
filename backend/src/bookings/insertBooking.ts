import { DateTime } from 'luxon'
import { pool } from '../db.js'

export class SlotTakenError extends Error {
  constructor() {
    super('slotTaken')
    this.name = 'SlotTakenError'
  }
}

export async function insertBooking(input: {
  eventTypeId: string
  inviteeName: string
  inviteeEmail: string
  inviteeTz: string
  startTimeUtc: DateTime
  endTimeUtc: DateTime
}) {
  try {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO bookings (
         event_type_id, invitee_name, invitee_email, invitee_tz,
         start_time_utc, end_time_utc, status
       ) VALUES ($1, $2, $3, $4, $5, $6, 'confirmed')
       RETURNING id`,
      [
        input.eventTypeId,
        input.inviteeName,
        input.inviteeEmail,
        input.inviteeTz,
        input.startTimeUtc.toUTC().toISO(),
        input.endTimeUtc.toUTC().toISO(),
      ],
    )
    return result.rows[0]
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw new SlotTakenError()
    }

    throw error
  }
}
