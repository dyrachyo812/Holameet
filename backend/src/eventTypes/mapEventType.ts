import type { EventType } from '@holameet/shared'

export type EventTypeRow = {
  id: string
  title: string
  slug: string
  duration_minutes: number
  is_active: boolean
}

export function toEventType(row: EventTypeRow): EventType {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    durationMinutes: row.duration_minutes,
    isActive: row.is_active,
  }
}
