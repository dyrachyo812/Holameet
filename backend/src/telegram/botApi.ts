const apiRoot = 'https://api.telegram.org'

type TelegramResult<T> = {
  ok: boolean
  result?: T
}

export type TelegramUpdate = {
  update_id: number
  message?: {
    text?: string
    chat: { id: number }
    from?: { id: number }
  }
}

type TelegramUser = {
  username?: string
}

function botUrl(method: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return null
  }

  return `${apiRoot}/bot${token}/${method}`
}

export async function telegramGetMe() {
  const url = botUrl('getMe')
  if (!url) {
    return null
  }

  const response = await fetch(url)
  const body = (await response.json()) as TelegramResult<TelegramUser>
  return body.ok ? (body.result?.username ?? null) : null
}

export async function sendTelegramMessage(chatId: string, text: string) {
  const url = botUrl('sendMessage')
  if (!url) {
    return false
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(10_000),
    })
    const body = (await response.json()) as TelegramResult<unknown>
    return body.ok === true
  } catch {
    return false
  }
}

export async function telegramGetUpdates(offset: number) {
  const url = botUrl('getUpdates')
  if (!url) {
    return []
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offset, timeout: 25, allowed_updates: ['message'] }),
    signal: AbortSignal.timeout(35_000),
  })
  const body = (await response.json()) as TelegramResult<TelegramUpdate[]> & {
    description?: string
  }
  if (!body.ok) {
    throw new Error(body.description ?? 'getUpdates failed')
  }

  return body.result ?? []
}

export async function telegramDeleteWebhook() {
  const url = botUrl('deleteWebhook')
  if (!url) {
    return
  }

  await fetch(url, { method: 'POST', signal: AbortSignal.timeout(10_000) })
}
