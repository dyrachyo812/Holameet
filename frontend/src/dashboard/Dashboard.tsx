import type { UserProfile } from '../api/client'
import { BookingsCard } from '../bookings/BookingsCard'
import { EventTypesCard } from '../eventTypes/EventTypesCard'
import { ProfileForm } from '../profile/ProfileForm'
import { StatsCard } from '../stats/StatsCard'

type DashboardProps = {
  user: UserProfile
  onUserChange: (user: UserProfile) => void
  onLogout: () => void
}

export function Dashboard({ user, onUserChange, onLogout }: DashboardProps) {
  return (
    <div className="space-y-4">
      <StatsCard />
      <BookingsCard timeZone={user.timezone} />
      <EventTypesCard username={user.username} />
      <ProfileForm user={user} onUserChange={onUserChange} onLogout={onLogout} />
    </div>
  )
}
