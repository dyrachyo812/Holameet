import { useEffect, useState } from 'react'
import type { TelegramStatusResponse } from '@holameet/shared'
import {
  connectTelegram,
  disconnectTelegram,
  getTelegramStatus,
} from '../api/client'
import { uk } from '../i18n/uk'
import { cardClass, ghostButtonClass, primaryButtonClass } from '../ui/classes'

export function TelegramCard() {
  const [status, setStatus] = useState<TelegramStatusResponse | null>(null)
  const [error, setError] = useState(false)

  async function loadStatus() {
    try {
      setStatus(await getTelegramStatus())
      setError(false)
    } catch {
      setStatus(null)
    }
  }

  useEffect(() => {
    void loadStatus()
    function onFocus() {
      void loadStatus()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  async function handleConnect() {
    try {
      const result = await connectTelegram()
      window.location.assign(result.deepLink)
    } catch {
      setError(true)
    }
  }

  async function handleDisconnect() {
    await disconnectTelegram()
    await loadStatus()
  }

  return (
    <section className={`${cardClass} space-y-3`}>
      <h3 className="text-sm font-semibold">{uk.telegramTitle}</h3>
      {status?.connected ? (
        <p className="text-sm text-zinc-600">{uk.telegramConnected}</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{uk.telegramError}</p> : null}
      {status?.connected ? (
        <button type="button" className={ghostButtonClass} onClick={() => void handleDisconnect()}>
          {uk.telegramDisconnect}
        </button>
      ) : (
        <button type="button" className={primaryButtonClass} onClick={() => void handleConnect()}>
          {uk.telegramConnect}
        </button>
      )}
    </section>
  )
}
