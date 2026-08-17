import { DateTime } from 'luxon'
import { pool } from '../db.js'
import {
  confirmGuestText,
  confirmOrganizerText,
  formatWhen,
  reminderText,
} from './copy.js'
import { sendOnce } from './sendOnce.js'

export type NotifyBooking = {
  id: string
  userId: string
  title: string
  organizerName: string
  organizerTz: string
  inviteeName: string
  inviteeEmail: string
  inviteeTz: string
  inviteeChatId: string | null
  organizerChatId: string | null
  emailMatchChatId: string | null
  startUtc: DateTime
  status: string
}

export async function loadNotifyBooking(bookingId: string) {
  const result = await pool.query<{
    id: string
    user_id: string
    title: string
    organizer_name: string
    organizer_tz: string
    invitee_name: string
    invitee_email: string
    invitee_tz: string
    invitee_telegram_chat_id: string | null
    organizer_chat_id: string | null
    email_match_chat_id: string | null
    start_time_utc: Date
    status: string
  }>(
    `SELECT
       bookings.id,
       event_types.user_id,
       event_types.title,
       users.name AS organizer_name,
       users.timezone AS organizer_tz,
       bookings.invitee_name,
       bookings.invitee_email,
       bookings.invitee_tz,
       bookings.invitee_telegram_chat_id::text,
       organizer.chat_id::text AS organizer_chat_id,
       guest_user.chat_id::text AS email_match_chat_id,
       bookings.start_time_utc,
       bookings.status
     FROM bookings
     JOIN event_types ON event_types.id = bookings.event_type_id
     JOIN users ON users.id = event_types.user_id
     LEFT JOIN telegram_connections AS organizer ON organizer.user_id = users.id
     LEFT JOIN users AS guest_account ON lower(guest_account.email) = bookings.invitee_email
     LEFT JOIN telegram_connections AS guest_user ON guest_user.user_id = guest_account.id
     WHERE bookings.id = $1`,
    [bookingId],
  )
  const row = result.rows[0]
  if (!row) {
    return null
  }

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    organizerName: row.organizer_name,
    organizerTz: row.organizer_tz,
    inviteeName: row.invitee_name,
    inviteeEmail: row.invitee_email,
    inviteeTz: row.invitee_tz,
    inviteeChatId: row.invitee_telegram_chat_id,
    organizerChatId: row.organizer_chat_id,
    emailMatchChatId: row.email_match_chat_id,
    startUtc: DateTime.fromJSDate(row.start_time_utc, { zone: 'utc' }),
    status: row.status,
  } satisfies NotifyBooking
}

function guestChat(booking: NotifyBooking) {
  return booking.inviteeChatId ?? booking.emailMatchChatId
}

export async function sendBookingConfirmations(bookingId: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return
  }

  const booking = await loadNotifyBooking(bookingId)
  if (!booking || booking.status !== 'confirmed') {
    return
  }

  if (booking.organizerChatId) {
    await sendOnce(
      booking.id,
      'confirm-organizer',
      booking.organizerChatId,
      confirmOrganizerText({
        title: booking.title,
        when: formatWhen(booking.startUtc, booking.organizerTz),
        inviteeName: booking.inviteeName,
      }),
    )
  }

  const chat = guestChat(booking)
  if (chat) {
    await sendOnce(
      booking.id,
      'confirm-guest',
      chat,
      confirmGuestText({
        title: booking.title,
        when: formatWhen(booking.startUtc, booking.inviteeTz),
        organizerName: booking.organizerName,
      }),
    )
  }
}

export async function sendReminder(bookingId: string, offsetMinutes: number) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return true
  }

  const booking = await loadNotifyBooking(bookingId)
  if (!booking || booking.status !== 'confirmed') {
    return true
  }

  if (booking.startUtc <= DateTime.utc().minus({ minutes: 1 })) {
    return true
  }

  const textOrganizer = reminderText({
    title: booking.title,
    when: formatWhen(booking.startUtc, booking.organizerTz),
  })
  const textGuest = reminderText({
    title: booking.title,
    when: formatWhen(booking.startUtc, booking.inviteeTz),
  })

  let ok = true
  if (booking.organizerChatId) {
    ok =
      (await sendOnce(
        booking.id,
        `reminder-${offsetMinutes}-organizer`,
        booking.organizerChatId,
        textOrganizer,
      )) && ok
  }

  const chat = guestChat(booking)
  if (chat) {
    ok =
      (await sendOnce(
        booking.id,
        `reminder-${offsetMinutes}-guest`,
        chat,
        textGuest,
      )) && ok
  }

  return ok
}
