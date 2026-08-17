import type {
  TelegramConnectResponse,
  TelegramDisconnectResponse,
  TelegramStatusResponse,
} from '@holameet/shared'
import { apiRoutes } from '@holameet/shared'
import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../http/requireAuth.js'
import { sendError } from '../http/sendError.js'
import { createLinkToken, telegramDeepLink } from './links.js'

export const telegramRouter = Router()

telegramRouter.get(apiRoutes.telegram, requireAuth, async (request, response) => {
  try {
    const result = await pool.query(
      `SELECT user_id FROM telegram_connections WHERE user_id = $1`,
      [request.session?.userId],
    )
    const body: TelegramStatusResponse = { connected: result.rows.length > 0 }
    response.json(body)
  } catch {
    sendError(response, 500, 'internalError', 'Failed to load Telegram status')
  }
})

telegramRouter.post(apiRoutes.telegramConnect, requireAuth, async (request, response) => {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    sendError(response, 500, 'internalError', 'Telegram is not configured')
    return
  }

  try {
    const userId = request.session?.userId
    if (!userId) {
      sendError(response, 401, 'unauthorized', 'Unauthorized')
      return
    }

    const token = await createLinkToken({ userId })
    const deepLink = await telegramDeepLink(token)
    if (!deepLink) {
      sendError(response, 500, 'internalError', 'Telegram is not configured')
      return
    }

    const body: TelegramConnectResponse = { deepLink }
    response.json(body)
  } catch {
    sendError(response, 500, 'internalError', 'Failed to start Telegram connect')
  }
})

telegramRouter.post(apiRoutes.telegramDisconnect, requireAuth, async (request, response) => {
  try {
    await pool.query(`DELETE FROM telegram_connections WHERE user_id = $1`, [
      request.session?.userId,
    ])
    const body: TelegramDisconnectResponse = { ok: true }
    response.json(body)
  } catch {
    sendError(response, 500, 'internalError', 'Failed to disconnect Telegram')
  }
})
