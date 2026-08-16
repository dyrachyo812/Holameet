import type {
  ApiErrorResponse,
  AuthResponse,
  LoginRequest,
  LogoutResponse,
  MeResponse,
  RegisterRequest,
  UpdateMeRequest,
  PublicEventTypeResponse,
  SlotListQuery,
  SlotListResponse,
  CreateBookingRequest,
  CreateBookingResponse,
  UserProfile,
} from '@holameet/shared'
import { apiRoutes } from '@holameet/shared'

function fillPublicPath(template: string, username: string, eventSlug: string) {
  return template
    .replace(':username', encodeURIComponent(username))
    .replace(':eventSlug', encodeURIComponent(eventSlug))
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  const body = (await response.json()) as T | ApiErrorResponse
  if (!response.ok) {
    throw body
  }

  return body as T
}

export function registerUser(payload: RegisterRequest) {
  return requestJson<AuthResponse>(apiRoutes.register, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function loginUser(payload: LoginRequest) {
  return requestJson<AuthResponse>(apiRoutes.login, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function logoutUser() {
  return requestJson<LogoutResponse>(apiRoutes.logout, { method: 'POST' })
}

export function getMe() {
  return requestJson<MeResponse>(apiRoutes.me)
}

export function getPublicEvent(username: string, eventSlug: string) {
  return requestJson<PublicEventTypeResponse>(
    fillPublicPath(apiRoutes.publicEventType, username, eventSlug),
  )
}

export function getPublicSlots(
  username: string,
  eventSlug: string,
  query: SlotListQuery,
) {
  const path = fillPublicPath(apiRoutes.publicSlots, username, eventSlug)
  const search = new URLSearchParams({ from: query.from, to: query.to })
  return requestJson<SlotListResponse>(`${path}?${search.toString()}`)
}

export function createPublicBooking(
  username: string,
  eventSlug: string,
  payload: CreateBookingRequest,
) {
  return requestJson<CreateBookingResponse>(
    fillPublicPath(apiRoutes.publicBookings, username, eventSlug),
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export function updateMe(payload: UpdateMeRequest) {
  return requestJson<MeResponse>(apiRoutes.me, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function readErrorCode(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof error.error === 'object' &&
    error.error !== null &&
    'code' in error.error &&
    typeof error.error.code === 'string'
  ) {
    return error.error.code
  }

  return 'internalError'
}

export type { UserProfile }
