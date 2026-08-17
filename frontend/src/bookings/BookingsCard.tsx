import { useEffect, useState } from 'react'
import type { Booking } from '@holameet/shared'
import { listBookings } from '../api/client'
import { uk } from '../i18n/uk'
import { cardClass } from '../ui/classes'

type BookingsCardProps = {
  timeZone: string
}

function formatWhen(startUtc: string, timeZone: string) {
  return new Intl.DateTimeFormat('uk-UA', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(startUtc))
}

export function BookingsCard({ timeZone }: BookingsCardProps) {
  const [items, setItems] = useState<Booking[] | null>(null)

  useEffect(() => {
    void listBookings()
      .then((result) => setItems(result.bookings))
      .catch(() => setItems([]))
  }, [])

  return (
    <section className={`${cardClass} space-y-3`}>
      <h3 className="text-sm font-semibold">{uk.upcoming}</h3>
      {items === null ? null : items.length === 0 ? (
        <p className="text-sm text-zinc-500">{uk.noBookings}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="border-t border-zinc-100 pt-3 first:border-t-0 first:pt-0">
              <p className="text-sm font-medium">{item.eventTypeTitle}</p>
              <p className="text-sm text-zinc-600">{formatWhen(item.startTimeUtc, timeZone)}</p>
              <p className="text-xs text-zinc-500">
                {item.inviteeName} · {item.inviteeEmail}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
