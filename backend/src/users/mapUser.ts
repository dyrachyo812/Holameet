import type { PublicUser, UserProfile, WorkingHours } from '@holameet/shared'

export type UserRow = {
  id: string
  email: string
  username: string
  name: string
  timezone: string
  working_hours_json: WorkingHours | null
  buffer_minutes: number
  created_at: Date
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    name: row.name,
    timezone: row.timezone,
  }
}

export function toUserProfile(row: UserRow): UserProfile {
  return {
    ...toPublicUser(row),
    workingHours: row.working_hours_json,
    bufferMinutes: row.buffer_minutes,
    createdAt: row.created_at.toISOString(),
  }
}
