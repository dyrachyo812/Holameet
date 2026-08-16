import type { Weekday, WorkingHours } from '@holameet/shared'
import { useState, type FormEvent } from 'react'
import { logoutUser, updateMe, type UserProfile } from '../api/client'
import { uk } from '../i18n/uk'
import {
  cardClass,
  fieldLabelClass,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
} from '../ui/classes'

const weekdays: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

type ProfileFormProps = {
  user: UserProfile
  onUserChange: (user: UserProfile) => void
  onLogout: () => void
}

function emptyHours(): WorkingHours {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  }
}

export function ProfileForm({ user, onUserChange, onLogout }: ProfileFormProps) {
  const [name, setName] = useState(user.name)
  const [timezone, setTimezone] = useState(user.timezone)
  const [bufferMinutes, setBufferMinutes] = useState(String(user.bufferMinutes))
  const [hours, setHours] = useState<WorkingHours>(user.workingHours ?? emptyHours())
  const [saved, setSaved] = useState(false)
  const [errorKey, setErrorKey] = useState<keyof typeof uk | null>(null)

  function setDay(day: Weekday, field: 'start' | 'end', value: string) {
    const current = hours[day][0] ?? { start: '09:00', end: '18:00' }
    setHours({ ...hours, [day]: [{ ...current, [field]: value }] })
  }

  function toggleDay(day: Weekday, enabled: boolean) {
    setHours({
      ...hours,
      [day]: enabled ? [{ start: '09:00', end: '18:00' }] : [],
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaved(false)
    setErrorKey(null)

    try {
      const result = await updateMe({
        name,
        timezone,
        bufferMinutes: Number(bufferMinutes),
        workingHours: hours,
      })
      onUserChange(result.user)
      setSaved(true)
    } catch {
      setErrorKey('validationError')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{uk.account}</h2>
          <p className="text-sm text-zinc-500">@{user.username}</p>
        </div>
        <button
          type="button"
          className={ghostButtonClass}
          onClick={async () => {
            await logoutUser()
            onLogout()
          }}
        >
          {uk.logout}
        </button>
      </header>

      <section className={`${cardClass} space-y-4`}>
        <label className="block">
          <span className={fieldLabelClass}>{uk.name}</span>
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={fieldLabelClass}>{uk.timezone}</span>
            <input
              className={inputClass}
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            />
          </label>
          <label className="block">
            <span className={fieldLabelClass}>{uk.bufferMinutes}</span>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={bufferMinutes}
              onChange={(event) => setBufferMinutes(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className={`${cardClass} space-y-3`}>
        <h3 className="text-sm font-semibold text-zinc-900">{uk.availability}</h3>
        {weekdays.map((day) => {
          const interval = hours[day][0]
          return (
            <div
              key={day}
              className="grid grid-cols-[8rem_1fr_1fr] items-center gap-3 border-t border-zinc-100 pt-3 text-sm first:border-t-0 first:pt-0"
            >
              <label className="flex items-center gap-2 font-medium text-zinc-700">
                <input
                  type="checkbox"
                  checked={Boolean(interval)}
                  onChange={(event) => toggleDay(day, event.target.checked)}
                />
                {uk[day]}
              </label>
              <input
                type="time"
                className={inputClass}
                disabled={!interval}
                value={interval?.start ?? ''}
                onChange={(event) => setDay(day, 'start', event.target.value)}
              />
              <input
                type="time"
                className={inputClass}
                disabled={!interval}
                value={interval?.end ?? ''}
                onChange={(event) => setDay(day, 'end', event.target.value)}
              />
            </div>
          )
        })}
      </section>

      {errorKey ? <p className="text-sm text-red-600">{uk[errorKey]}</p> : null}
      {saved ? <p className="text-sm text-zinc-600">{uk.saved}</p> : null}
      <button type="submit" className={`${primaryButtonClass} sm:w-auto`}>
        {uk.save}
      </button>
    </form>
  )
}
