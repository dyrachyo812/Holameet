import { useState } from 'react'
import type { Slot } from '@holameet/shared'
import { uk } from '../i18n/uk'

type SlotCalendarProps = {
  slots: Slot[]
  timeZone: string
  selected: string | null
  onSelect: (startTimeUtc: string) => void
}

function localDateKey(startUtc: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(startUtc))
}

function formatDayHeading(startUtc: string, timeZone: string) {
  return new Intl.DateTimeFormat('uk-UA', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(startUtc))
}

function formatTime(startUtc: string, timeZone: string) {
  return new Intl.DateTimeFormat('uk-UA', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(startUtc))
}

function groupByDay(slots: Slot[], timeZone: string) {
  const groups = new Map<string, Slot[]>()
  for (const slot of slots) {
    const key = localDateKey(slot.startTimeUtc, timeZone)
    const list = groups.get(key) ?? []
    list.push(slot)
    groups.set(key, list)
  }
  return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right))
}

export function SlotCalendar({ slots, timeZone, selected, onSelect }: SlotCalendarProps) {
  const days = groupByDay(slots, timeZone)
  const [day, setDay] = useState<string | null>(null)
  const activeDay = day ?? days[0]?.[0] ?? null
  const times = days.find(([key]) => key === activeDay)?.[1] ?? []

  if (days.length === 0) {
    return <p className="text-sm text-zinc-500">{uk.noSlots}</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map(([key, daySlots]) => (
          <button
            key={key}
            type="button"
            className={`shrink-0 rounded-md border px-3 py-2 text-left text-sm ${
              key === activeDay
                ? 'border-zinc-900 bg-zinc-900 text-white'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
            }`}
            onClick={() => setDay(key)}
          >
            {formatDayHeading(daySlots[0].startTimeUtc, timeZone)}
          </button>
        ))}
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700">{uk.pickSlot}</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {times.map((slot) => (
            <button
              key={slot.startTimeUtc}
              type="button"
              className={`h-10 rounded-md border text-sm ${
                selected === slot.startTimeUtc
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 bg-white hover:border-zinc-400'
              }`}
              onClick={() => onSelect(slot.startTimeUtc)}
            >
              {formatTime(slot.startTimeUtc, timeZone)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
