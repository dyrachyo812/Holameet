import type { DateTime } from 'luxon'
import { scheduleReminders } from '../queue/reminders.js'
import { createLinkToken, telegramDeepLink } from './links.js'
import { sendBookingConfirmations } from './notify.js'

async function ignore(run: () => Promise<unknown>) {
  try {
    await run()
  } catch {
    return
  }
}

export async function afterBookingConfirmed(bookingId: string, startUtc: DateTime) {
  await ignore(() => sendBookingConfirmations(bookingId))
  await ignore(() => scheduleReminders(bookingId, startUtc))

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return null
  }

  try {
    const token = await createLinkToken({ bookingId })
    return await telegramDeepLink(token)
  } catch {
    return null
  }
}
