import { telegramDeleteWebhook, telegramGetUpdates } from './botApi.js'
import { completeTelegramStart } from './completeStart.js'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function startTelegramPoll() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('Telegram poll skipped: TELEGRAM_BOT_TOKEN is empty')
    return
  }

  try {
    await telegramDeleteWebhook()
  } catch (error) {
    console.error('Telegram deleteWebhook failed', error)
  }

  console.error('Telegram poll started')
  let offset = 0
  while (true) {
    try {
      const updates = await telegramGetUpdates(offset)
      for (const update of updates) {
        offset = update.update_id + 1
        const message = update.message
        const text = message?.text ?? ''
        const chatId = message?.chat.id
        const telegramUserId = message?.from?.id
        if (!chatId || telegramUserId === undefined || !text.startsWith('/start')) {
          continue
        }

        await completeTelegramStart({
          token: text.slice('/start'.length).trim(),
          chatId: String(chatId),
          telegramUserId: String(telegramUserId),
        })
      }
    } catch (error) {
      console.error('Telegram poll error', error)
      await sleep(2000)
    }
  }
}
