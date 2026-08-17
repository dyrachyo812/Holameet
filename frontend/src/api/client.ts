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
  CalendarStatusResponse,
  CalendarConnectResponse,
  CalendarDisconnectResponse,
  UserProfile,
  EventTypeListResponse,
  EventTypeResponse,
  CreateEventTypeRequest,
  UpdateEventTypeRequest,
  BookingListQuery,
  BookingListResponse,
  StatsQuery,
  StatsResponse,
  TelegramStatusResponse,
  TelegramConnectResponse,
  TelegramDisconnectResponse,
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

export function getCalendarStatus() {
  return requestJson<CalendarStatusResponse>(apiRoutes.calendar)
}

export function connectCalendar() {
  return requestJson<CalendarConnectResponse>(apiRoutes.calendarConnect, {
    method: 'POST',
  })
}

export function disconnectCalendar() {
  return requestJson<CalendarDisconnectResponse>(apiRoutes.calendarDisconnect, {
    method: 'POST',
  })
}

function fillEventTypePath(eventTypeId: string) {
  return apiRoutes.eventType.replace(':eventTypeId', encodeURIComponent(eventTypeId))
}

export function listEventTypes() {
  return requestJson<EventTypeListResponse>(apiRoutes.eventTypes)
}

export function createEventType(payload: CreateEventTypeRequest) {
  return requestJson<EventTypeResponse>(apiRoutes.eventTypes, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateEventType(eventTypeId: string, payload: UpdateEventTypeRequest) {
  return requestJson<EventTypeResponse>(fillEventTypePath(eventTypeId), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function listBookings(query: BookingListQuery = {}) {
  const search = new URLSearchParams()
  if (query.from) {
    search.set('from', query.from)
  }
  if (query.to) {
    search.set('to', query.to)
  }
  const suffix = search.toString() ? `?${search.toString()}` : ''
  return requestJson<BookingListResponse>(`${apiRoutes.bookings}${suffix}`)
}

export function getStats(query: StatsQuery) {
  const search = new URLSearchParams({ from: query.from, to: query.to })
  return requestJson<StatsResponse>(`${apiRoutes.stats}?${search.toString()}`)
}

export function getTelegramStatus() {
  return requestJson<TelegramStatusResponse>(apiRoutes.telegram)
}

export function connectTelegram() {
  return requestJson<TelegramConnectResponse>(apiRoutes.telegramConnect, {
    method: 'POST',
  })
}

export function disconnectTelegram() {
  return requestJson<TelegramDisconnectResponse>(apiRoutes.telegramDisconnect, {
    method: 'POST',
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
