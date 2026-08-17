import { useEffect, useState } from 'react'
import type { CalendarStatusResponse } from '@holameet/shared'
import {
  connectCalendar,
  disconnectCalendar,
  getCalendarStatus,
} from '../api/client'
import { uk } from '../i18n/uk'
import { cardClass, ghostButtonClass, primaryButtonClass } from '../ui/classes'

export function CalendarCard() {
  const [status, setStatus] = useState<CalendarStatusResponse | null>(null)

  async function loadStatus() {
    try {
      setStatus(await getCalendarStatus())
    } catch {
      setStatus(null)
    }
  }

  useEffect(() => {
    void loadStatus()
  }, [])

  async function handleConnect() {
    try {
      const result = await connectCalendar()
      window.location.assign(result.authorizationUrl)
    } catch {
      window.location.assign('/?calendar=error')
    }
  }

  async function handleDisconnect() {
    await disconnectCalendar()
    await loadStatus()
  }

  const needsReconnect = status?.connected && !status.isValid

  return (
    <section className={`${cardClass} space-y-3`}>
      <h3 className="text-sm font-semibold">{uk.calendarTitle}</h3>
      {needsReconnect ? (
        <p className="text-sm text-red-600">{uk.calendarReconnect}</p>
      ) : null}
      {status?.connected && status.isValid ? (
        <p className="text-sm text-zinc-600">{uk.calendarConnected}</p>
      ) : null}
      {status?.connected ? (
        <div className="flex gap-2">
          {needsReconnect ? (
            <button type="button" className={primaryButtonClass} onClick={() => void handleConnect()}>
              {uk.calendarConnect}
            </button>
          ) : null}
          <button type="button" className={ghostButtonClass} onClick={() => void handleDisconnect()}>
            {uk.calendarDisconnect}
          </button>
        </div>
      ) : (
        <button type="button" className={primaryButtonClass} onClick={() => void handleConnect()}>
          {uk.calendarConnect}
        </button>
      )}
    </section>
  )
}
