import type { ApiErrorCode, ApiErrorResponse } from '@holameet/shared'
import type { Response } from 'express'

export function sendError(
  response: Response,
  status: number,
  code: ApiErrorCode,
  message: string,
) {
  const body: ApiErrorResponse = { error: { code, message } }
  response.status(status).json(body)
}
