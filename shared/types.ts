export type IsoDateTime = string
export type IsoDate = string
export type TimeZone = string

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type WorkingHoursInterval = {
  start: string
  end: string
}

export type WorkingHours = Record<Weekday, WorkingHoursInterval[]>

export type BookingStatus = 'confirmed' | 'cancelled'
export type CalendarProvider = 'google'

export type ApiErrorCode =
  | 'validationError'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'slotTaken'
  | 'calendarDisconnected'
  | 'internalError'

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode
    message: string
  }
}

export type HealthResponse = {
  status: 'ok'
}

export const apiRoutes = {
  health: '/health',
  register: '/auth/register',
  login: '/auth/login',
  logout: '/auth/logout',
  me: '/me',
  eventTypes: '/event-types',
  eventType: '/event-types/:eventTypeId',
  bookings: '/bookings',
  stats: '/stats',
  calendar: '/calendar',
  calendarConnect: '/calendar/connect',
  calendarDisconnect: '/calendar/disconnect',
  calendarCallback: '/calendar/callback',
  telegram: '/telegram',
  telegramConnect: '/telegram/connect',
  telegramDisconnect: '/telegram/disconnect',
  publicEventType: '/public/:username/:eventSlug',
  publicSlots: '/public/:username/:eventSlug/slots',
  publicBookings: '/public/:username/:eventSlug/bookings',
} as const

export type PublicUser = {
  id: string
  email: string
  username: string
  name: string
  timezone: TimeZone
}

export type UserProfile = PublicUser & {
  workingHours: WorkingHours | null
  bufferMinutes: number
  createdAt: IsoDateTime
}

export type RegisterRequest = {
  email: string
  password: string
  name: string
  username: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type AuthResponse = {
  user: PublicUser
}

export type LogoutResponse = {
  ok: true
}

export type MeResponse = {
  user: UserProfile
}

export type UpdateMeRequest = {
  name?: string
  timezone?: TimeZone
  workingHours?: WorkingHours
  bufferMinutes?: number
}

export type EventType = {
  id: string
  title: string
  slug: string
  durationMinutes: number
  isActive: boolean
}

export type EventTypeListResponse = {
  eventTypes: EventType[]
}

export type EventTypeResponse = {
  eventType: EventType
}

export type CreateEventTypeRequest = {
  title: string
  slug: string
  durationMinutes: number
}

export type UpdateEventTypeRequest = {
  title?: string
  slug?: string
  durationMinutes?: number
  isActive?: boolean
}

export type Booking = {
  id: string
  eventTypeId: string
  eventTypeTitle: string
  inviteeName: string
  inviteeEmail: string
  inviteeTz: TimeZone
  startTimeUtc: IsoDateTime
  endTimeUtc: IsoDateTime
  status: BookingStatus
  calendarEventId: string | null
  createdAt: IsoDateTime
}

export type BookingListQuery = {
  from?: IsoDateTime
  to?: IsoDateTime
}

export type BookingListResponse = {
  bookings: Booking[]
}

export type CreateBookingRequest = {
  inviteeName: string
  inviteeEmail: string
  inviteeTz: TimeZone
  startTimeUtc: IsoDateTime
  consentGiven: true
}

export type CreateBookingResponse = {
  booking: {
    id: string
    startTimeUtc: IsoDateTime
    endTimeUtc: IsoDateTime
    status: 'confirmed'
  }
}

export type Slot = {
  startTimeUtc: IsoDateTime
  endTimeUtc: IsoDateTime
}

export type SlotListQuery = {
  from: IsoDate
  to: IsoDate
}

export type SlotListResponse = {
  slots: Slot[]
}

export type PublicEventTypeResponse = {
  organizer: {
    name: string
    username: string
    timezone: TimeZone
  }
  eventType: {
    title: string
    slug: string
    durationMinutes: number
  }
}

export type CalendarStatusResponse = {
  connected: boolean
  provider: CalendarProvider | null
  isValid: boolean
  expiresAt: IsoDateTime | null
}

export type CalendarConnectResponse = {
  authorizationUrl: string
}

export type CalendarDisconnectResponse = {
  ok: true
}

export type CalendarOAuthCallbackQuery = {
  code: string
  state: string
}

export type TelegramStatusResponse = {
  connected: boolean
}

export type TelegramConnectResponse = {
  deepLink: string
}

export type TelegramDisconnectResponse = {
  ok: true
}

export type StatsQuery = {
  from: IsoDate
  to: IsoDate
}

export type StatsResponse = {
  bookingsCount: number
  from: IsoDate
  to: IsoDate
}
