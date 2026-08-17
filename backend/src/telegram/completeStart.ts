import { pool } from '../db.js'
import { telegramCopy } from './copy.js'
import { sendTelegramMessage } from './botApi.js'
import { sendBookingConfirmations } from './notify.js'

export async function completeTelegramStart(input: {
  token: string
  chatId: string
  telegramUserId: string
}) {
  if (!input.token) {
    await sendTelegramMessage(input.chatId, telegramCopy.startHelp)
    return
  }

  const result = await pool.query<{
    user_id: string | null
    booking_id: string | null
  }>(
    `SELECT user_id, booking_id
     FROM telegram_link_tokens
     WHERE token = $1 AND expires_at > now()`,
    [input.token],
  )
  const row = result.rows[0]
  if (!row) {
    await sendTelegramMessage(input.chatId, telegramCopy.invalidLink)
    return
  }

  if (row.user_id) {
    await pool.query(
      `DELETE FROM telegram_connections WHERE telegram_user_id = $1 OR user_id = $2`,
      [input.telegramUserId, row.user_id],
    )
    await pool.query(
      `INSERT INTO telegram_connections (user_id, telegram_user_id, chat_id)
       VALUES ($1, $2, $3)`,
      [row.user_id, input.telegramUserId, input.chatId],
    )
    await sendTelegramMessage(input.chatId, telegramCopy.connected)
    return
  }

  if (row.booking_id) {
    await pool.query(
      `UPDATE bookings SET invitee_telegram_chat_id = $2 WHERE id = $1`,
      [row.booking_id, input.chatId],
    )
    await sendTelegramMessage(input.chatId, telegramCopy.guestLinked)
    await sendBookingConfirmations(row.booking_id)
  }
}
