import type { Request, Response, NextFunction } from 'express'
import { sendError } from '../http/sendError.js'

export function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  if (!request.session?.userId) {
    sendError(response, 401, 'unauthorized', 'Unauthorized')
    return
  }

  next()
}
