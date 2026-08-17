import type {
  CreateBookingRequest,
  CreateBookingResponse,
  PublicEventTypeResponse,
  SlotListResponse,
} from '@holameet/shared'
import { apiRoutes } from '@holameet/shared'
import { Router } from 'express'
import { DateTime } from 'luxon'
import { insertBooking, SlotTakenError } from '../bookings/insertBooking.js'
import { createGoogleEvent } from '../calendar/createEvent.js'
import { sendError } from '../http/sendError.js'
import { findPublicEvent, listOpenSlots } from './loadEvent.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const maxRangeDays = 28

export const publicRouter = Router()

publicRouter.get(apiRoutes.publicEventType, async (request, response) => {
  const event = await findPublicEvent(
    String(request.params.username),
    String(request.params.eventSlug),
  )
  if (!event) {
    sendError(response, 404, 'notFound', 'Event not found')
    return
  }

  const body: PublicEventTypeResponse = {
    organizer: {
      name: event.organizerName,
      username: event.username,
      timezone: event.timezone,
    },
    eventType: {
      title: event.title,
      slug: event.slug,
      durationMinutes: event.durationMinutes,
    },
  }
  response.json(body)
})

publicRouter.get(apiRoutes.publicSlots, async (request, response) => {
  const event = await findPublicEvent(
    String(request.params.username),
    String(request.params.eventSlug),
  )
  if (!event) {
    sendError(response, 404, 'notFound', 'Event not found')
    return
  }

  const fromDate = String(request.query.from ?? '')
  const toDate = String(request.query.to ?? '')
  const from = DateTime.fromISO(fromDate, { zone: event.timezone })
  const to = DateTime.fromISO(toDate, { zone: event.timezone })

  if (!from.isValid || !to.isValid || to < from || to.diff(from, 'days').days > maxRangeDays) {
    sendError(response, 400, 'validationError', 'Invalid date range')
    return
  }

  const slots = await listOpenSlots(event, fromDate, toDate)
  const body: SlotListResponse = {
    slots: slots.map((slot) => ({
      startTimeUtc: slot.startUtc.toISO() ?? '',
      endTimeUtc: slot.endUtc.toISO() ?? '',
    })),
  }
  response.json(body)
})

publicRouter.post(apiRoutes.publicBookings, async (request, response) => {
  const event = await findPublicEvent(
    String(request.params.username),
    String(request.params.eventSlug),
  )
  if (!event) {
    sendError(response, 404, 'notFound', 'Event not found')
    return
  }

  const body = request.body as CreateBookingRequest
  const inviteeName = body.inviteeName?.trim()
  const inviteeEmail = body.inviteeEmail?.trim().toLowerCase()
  const inviteeTz = body.inviteeTz?.trim()
  const startTimeUtc = DateTime.fromISO(body.startTimeUtc, { zone: 'utc' })

  if (
    !inviteeName ||
    !emailPattern.test(inviteeEmail ?? '') ||
    !inviteeTz ||
    !startTimeUtc.isValid ||
    body.consentGiven !== true
  ) {
    sendError(response, 400, 'validationError', 'Invalid booking data')
    return
  }

  const day = startTimeUtc.setZone(event.timezone).toISODate()
  if (!day) {
    sendError(response, 400, 'validationError', 'Invalid booking data')
    return
  }

  const openSlots = await listOpenSlots(event, day, day)
  const match = openSlots.find((slot) => slot.startUtc.equals(startTimeUtc))
  if (!match) {
    sendError(response, 409, 'slotTaken', 'Slot is not available')
    return
  }

  try {
    const created = await insertBooking({
      eventTypeId: event.eventTypeId,
      inviteeName,
      inviteeEmail,
      inviteeTz,
      startTimeUtc: match.startUtc,
      endTimeUtc: match.endUtc,
    })
    await createGoogleEvent({
      userId: event.userId,
      bookingId: created.id,
      title: event.title,
      inviteeName,
      inviteeEmail,
      startTimeUtc: match.startUtc,
      endTimeUtc: match.endUtc,
    })
    const payload: CreateBookingResponse = {
      booking: {
        id: created.id,
        startTimeUtc: match.startUtc.toISO() ?? '',
        endTimeUtc: match.endUtc.toISO() ?? '',
        status: 'confirmed',
      },
    }
    response.status(201).json(payload)
  } catch (error) {
    if (error instanceof SlotTakenError) {
      sendError(response, 409, 'slotTaken', 'Slot is not available')
      return
    }

    sendError(response, 500, 'internalError', 'Booking failed')
  }
})
