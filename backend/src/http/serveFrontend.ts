import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Express, NextFunction, Request, Response } from 'express'
import express from 'express'

const apiPrefixes = [
  '/auth',
  '/me',
  '/health',
  '/public',
  '/calendar',
  '/event-types',
  '/bookings',
  '/stats',
  '/telegram',
]

function isApiPath(pathname: string) {
  return apiPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function attachFrontend(app: Express) {
  const dist = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../frontend/dist',
  )
  if (!fs.existsSync(dist)) {
    return
  }

  app.use(express.static(dist))
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (request.method !== 'GET' || isApiPath(request.path)) {
      next()
      return
    }

    response.sendFile(path.join(dist, 'index.html'))
  })
}
