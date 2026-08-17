import { sendTelegramMessage } from './botApi.js'
import { claimReceipt, releaseReceipt } from './receipts.js'

export async function sendOnce(
  bookingId: string,
  kind: string,
  chatId: string,
  text: string,
) {
  const claimed = await claimReceipt(bookingId, kind)
  if (!claimed) {
    return true
  }

  const ok = await sendTelegramMessage(chatId, text)
  if (!ok) {
    await releaseReceipt(bookingId, kind)
    return false
  }

  return true
}
