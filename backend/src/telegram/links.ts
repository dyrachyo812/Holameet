import { randomBytes } from 'node:crypto'
import { pool } from '../db.js'
import { telegramGetMe } from './botApi.js'

let cachedUsername = ''

export async function botUsername() {
  if (cachedUsername) {
    return cachedUsername
  }

  const username = await telegramGetMe()
  if (username) {
    cachedUsername = username
  }

  return username
}

export async function createLinkToken(target: { userId: string } | { bookingId: string }) {
  const token = randomBytes(16).toString('hex')
  const minutes = 'bookingId' in target ? 10080 : 15
  await pool.query(
    `INSERT INTO telegram_link_tokens (token, user_id, booking_id, expires_at)
     VALUES ($1, $2, $3, now() + ($4 * interval '1 minute'))`,
    [
      token,
      'userId' in target ? target.userId : null,
      'bookingId' in target ? target.bookingId : null,
      minutes,
    ],
  )
  return token
}

export async function telegramDeepLink(token: string) {
  const username = await botUsername()
  if (!username) {
    return null
  }

  return `https://t.me/${username}?start=${token}`
}
