import './loadEnv.js'
import type { HealthResponse } from '@holameet/shared'
import cookieSession from 'cookie-session'
import express from 'express'
import { authRouter } from './auth/routes.js'
import { publicRouter } from './public/routes.js'
import { usersRouter } from './users/routes.js'

export function createApp() {
  const cookieSecret = process.env.COOKIE_SECRET
  if (!cookieSecret) {
    throw new Error('COOKIE_SECRET is required')
  }

  const app = express()
  app.use(express.json())
  app.use(
    cookieSession({
      name: 'holameetSession',
      keys: [cookieSecret],
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }),
  )
  app.use(authRouter)
  app.use(usersRouter)
  app.use(publicRouter)
  app.get('/health', (request, response) => {
    const body: HealthResponse = { status: 'ok' }
    response.json(body)
  })
  return app
}
