import '../loadEnv.js'
import { DateTime } from 'luxon'
import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { pool } from '../db.js'
import { insertBooking, SlotTakenError } from './insertBooking.js'

async function seedEvent() {
  const user = await pool.query<{ id: string }>(
    `INSERT INTO users (email, username, password_hash, name)
     VALUES ($1, $2, 'hash', 'Host')
     RETURNING id`,
    [`race-${Date.now()}@example.com`, `race${Date.now()}`],
  )
  const event = await pool.query<{ id: string }>(
    `INSERT INTO event_types (user_id, title, slug, duration_minutes)
     VALUES ($1, 'Consult', 'consult', 30)
     RETURNING id`,
    [user.rows[0].id],
  )
  return event.rows[0].id
}

describe('insertBooking', () => {
  const createdEventIds: string[] = []

  afterEach(async () => {
    for (const eventTypeId of createdEventIds) {
      await pool.query('DELETE FROM bookings WHERE event_type_id = $1', [eventTypeId])
      await pool.query('DELETE FROM event_types WHERE id = $1', [eventTypeId])
    }
    await pool.query(
      `DELETE FROM users WHERE username LIKE 'race%'`,
    )
    createdEventIds.length = 0
  })

  afterAll(async () => {
    await pool.end()
  })

  it('rejects a second confirmed booking for the same start', async () => {
    const eventTypeId = await seedEvent()
    createdEventIds.push(eventTypeId)
    const start = DateTime.fromISO('2026-09-01T10:00:00Z')
    const end = start.plus({ minutes: 30 })
    const payload = {
      eventTypeId,
      inviteeName: 'Guest',
      inviteeEmail: 'g@example.com',
      inviteeTz: 'Europe/Kyiv',
      startTimeUtc: start,
      endTimeUtc: end,
    }

    await insertBooking(payload)
    await expect(insertBooking({ ...payload, inviteeEmail: 'h@example.com' })).rejects.toBeInstanceOf(
      SlotTakenError,
    )
  })

  it('allows only one of two concurrent inserts for the same slot', async () => {
    const eventTypeId = await seedEvent()
    createdEventIds.push(eventTypeId)
    const start = DateTime.fromISO('2026-09-01T11:00:00Z')
    const end = start.plus({ minutes: 30 })
    const payload = {
      eventTypeId,
      inviteeName: 'Guest',
      inviteeEmail: 'a@example.com',
      inviteeTz: 'Europe/Kyiv',
      startTimeUtc: start,
      endTimeUtc: end,
    }

    const results = await Promise.allSettled([
      insertBooking(payload),
      insertBooking({ ...payload, inviteeEmail: 'b@example.com' }),
    ])
    const ok = results.filter((result) => result.status === 'fulfilled')
    const taken = results.filter(
      (result) =>
        result.status === 'rejected' && result.reason instanceof SlotTakenError,
    )

    expect(ok).toHaveLength(1)
    expect(taken).toHaveLength(1)
  })
})
