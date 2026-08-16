import { useEffect, useState, type FormEvent } from 'react'
import {
  createPublicBooking,
  getPublicEvent,
  getPublicSlots,
  readErrorCode,
} from '../api/client'
import { uk } from '../i18n/uk'
import {
  cardClass,
  fieldLabelClass,
  inputClass,
  primaryButtonClass,
} from '../ui/classes'
import type { PublicEventTypeResponse, Slot } from '@holameet/shared'

type PublicBookingPageProps = {
  username: string
  eventSlug: string
}

function guestTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

function formatSlot(startUtc: string, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(startUtc))
}

function rangeDates() {
  const from = new Date()
  const to = new Date()
  to.setUTCDate(to.getUTCDate() + 14)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

export function PublicBookingPage({ username, eventSlug }: PublicBookingPageProps) {
  const timeZone = guestTimeZone()
  const [event, setEvent] = useState<PublicEventTypeResponse | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [errorKey, setErrorKey] = useState<keyof typeof uk | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const dates = rangeDates()
    void Promise.all([
      getPublicEvent(username, eventSlug),
      getPublicSlots(username, eventSlug, dates),
    ])
      .then(([eventBody, slotBody]) => {
        setEvent(eventBody)
        setSlots(slotBody.slots)
      })
      .catch(() => setErrorKey('internalError'))
  }, [username, eventSlug])

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault()
    if (!selected || !consent) {
      setErrorKey('validationError')
      return
    }

    setErrorKey(null)
    try {
      await createPublicBooking(username, eventSlug, {
        inviteeName: name,
        inviteeEmail: email,
        inviteeTz: timeZone,
        startTimeUtc: selected,
        consentGiven: true,
      })
      setDone(true)
    } catch (error) {
      const code = readErrorCode(error)
      setErrorKey(code === 'slotTaken' ? 'slotTaken' : 'validationError')
    }
  }

  if (done && event && selected) {
    return (
      <section className={`${cardClass} mx-auto max-w-md`}>
        <h2 className="text-lg font-semibold">{uk.booked}</h2>
        <p className="mt-2 text-sm text-zinc-600">
          {event.eventType.title} · {formatSlot(selected, timeZone)}
        </p>
      </section>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} mx-auto max-w-md space-y-4`}>
      <div>
        <h2 className="text-lg font-semibold">{event?.eventType.title ?? uk.appName}</h2>
        <p className="text-sm text-zinc-500">
          {event?.organizer.name} ·           {event?.eventType.durationMinutes} {uk.durationMinutes}
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          {uk.yourTimezone}: {timeZone}
        </p>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{uk.pickSlot}</legend>
        {slots.length === 0 ? (
          <p className="text-sm text-zinc-500">{uk.noSlots}</p>
        ) : (
          <div className="grid max-h-56 gap-2 overflow-auto">
            {slots.map((slot) => (
              <label
                key={slot.startTimeUtc}
                className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name="slot"
                  checked={selected === slot.startTimeUtc}
                  onChange={() => setSelected(slot.startTimeUtc)}
                />
                {formatSlot(slot.startTimeUtc, timeZone)}
              </label>
            ))}
          </div>
        )}
      </fieldset>
      <label className="block">
        <span className={fieldLabelClass}>{uk.name}</span>
        <input
          className={inputClass}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>
      <label className="block">
        <span className={fieldLabelClass}>{uk.email}</span>
        <input
          type="email"
          className={inputClass}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="flex items-start gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        {uk.consent}
      </label>
      {errorKey ? <p className="text-sm text-red-600">{uk[errorKey]}</p> : null}
      <button type="submit" className={primaryButtonClass} disabled={!selected || !consent}>
        {uk.book}
      </button>
    </form>
  )
}
