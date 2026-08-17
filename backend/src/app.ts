import './loadEnv.js'
import type { HealthResponse } from '@holameet/shared'
import cookieSession from 'cookie-session'
import express from 'express'
import { authRouter } from './auth/routes.js'
import { bookingsRouter } from './bookings/routes.js'
import { calendarRouter } from './calendar/routes.js'
import { eventTypesRouter } from './eventTypes/routes.js'
import { publicRouter } from './public/routes.js'
import { statsRouter } from './stats/routes.js'
import { telegramRouter } from './telegram/routes.js'
import { usersRouter } from './users/routes.js'
import { attachFrontend } from './http/serveFrontend.js'

export function createApp() {
  const cookieSecret = process.env.COOKIE_SECRET
  if (!cookieSecret) {
    throw new Error('COOKIE_SECRET is required')
  }

  const app = express()
  app.set('trust proxy', 1)
  app.use(express.json())
  app.use(
    cookieSession({
      name: 'holameetSession',
      keys: [cookieSecret],
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }),
  )
  app.use(authRouter)
  app.use(usersRouter)
  app.use(eventTypesRouter)
  app.use(bookingsRouter)
  app.use(statsRouter)
  app.use(calendarRouter)
  app.use(telegramRouter)
  app.use(publicRouter)
  app.get('/health', (request, response) => {
    const body: HealthResponse = { status: 'ok' }
    response.json(body)
  })
  attachFrontend(app)
  return app
}
