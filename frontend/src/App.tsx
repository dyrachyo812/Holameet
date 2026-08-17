import { useEffect, useState } from 'react'
import { getMe, type UserProfile } from './api/client'
import { AuthForm } from './auth/AuthForm'
import { uk } from './i18n/uk'
import { Dashboard } from './dashboard/Dashboard'
import { PublicBookingPage } from './public/PublicBookingPage'

function publicRoute() {
  const match = window.location.pathname.match(/^\/u\/([^/]+)\/([^/]+)$/)
  if (!match) {
    return null
  }

  return { username: decodeURIComponent(match[1]), eventSlug: decodeURIComponent(match[2]) }
}

export function App() {
  const booking = publicRoute()
  const calendarNotice = new URLSearchParams(window.location.search).get('calendar')
  const [user, setUser] = useState<UserProfile | null>(null)
  const [ready, setReady] = useState(false)

  async function loadUser() {
    try {
      const result = await getMe()
      setUser(result.user)
    } catch {
      setUser(null)
    } finally {
      setReady(true)
    }
  }

  useEffect(() => {
    if (publicRoute()) {
      setReady(true)
      return
    }

    void loadUser()
  }, [])

  return (
    <main className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white">
        <div
          className={`mx-auto flex h-14 items-center px-6 ${booking ? 'max-w-3xl' : 'max-w-2xl'}`}
        >
          <span className="text-sm font-semibold tracking-tight">{uk.appName}</span>
        </div>
      </header>
      <div className={`mx-auto px-6 py-10 ${booking ? 'max-w-3xl' : 'max-w-2xl'}`}>
        {booking ? (
          <PublicBookingPage username={booking.username} eventSlug={booking.eventSlug} />
        ) : (
          <>
            {!user ? (
              <p className="mb-6 text-center text-sm text-zinc-500">{uk.tagline}</p>
            ) : null}
            {calendarNotice === 'denied' ? (
              <p className="mb-4 text-center text-sm text-red-600">{uk.calendarDenied}</p>
            ) : null}
            {calendarNotice === 'error' ? (
              <p className="mb-4 text-center text-sm text-red-600">{uk.calendarError}</p>
            ) : null}
            {calendarNotice === 'connected' ? (
              <p className="mb-4 text-center text-sm text-zinc-600">{uk.calendarConnected}</p>
            ) : null}
            {ready ? (
              user ? (
                <Dashboard
                  user={user}
                  onUserChange={setUser}
                  onLogout={() => setUser(null)}
                />
              ) : (
                <AuthForm onSuccess={() => void loadUser()} />
              )
            ) : null}
          </>
        )}
      </div>
    </main>
  )
}
