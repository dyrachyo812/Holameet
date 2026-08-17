import { useEffect, useState, type FormEvent } from 'react'
import type { EventType } from '@holameet/shared'
import {
  createEventType,
  listEventTypes,
  readErrorCode,
  updateEventType,
} from '../api/client'
import { uk } from '../i18n/uk'
import {
  cardClass,
  fieldLabelClass,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
} from '../ui/classes'

type EventTypesCardProps = {
  username: string
}

const emptyForm = {
  title: '',
  slug: '',
  durationMinutes: '30',
}

export function EventTypesCard({ username }: EventTypesCardProps) {
  const [items, setItems] = useState<EventType[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState<keyof typeof uk | null>(null)

  async function reload() {
    const result = await listEventTypes()
    setItems(result.eventTypes)
  }

  useEffect(() => {
    void reload().catch(() => setErrorKey('internalError'))
  }, [])

  function publicUrl(slug: string) {
    return `${window.location.origin}/u/${username}/${slug}`
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrorKey(null)
    const payload = {
      title: form.title,
      slug: form.slug,
      durationMinutes: Number(form.durationMinutes),
    }

    try {
      if (editingId) {
        await updateEventType(editingId, payload)
      } else {
        await createEventType(payload)
      }
      setForm(emptyForm)
      setEditingId(null)
      await reload()
    } catch (error) {
      const code = readErrorCode(error)
      setErrorKey(code === 'conflict' ? 'slugTaken' : 'validationError')
    }
  }

  async function toggleActive(item: EventType) {
    await updateEventType(item.id, { isActive: !item.isActive })
    await reload()
  }

  async function copyLink(item: EventType) {
    await navigator.clipboard.writeText(publicUrl(item.slug))
    setCopiedId(item.id)
  }

  return (
    <section className={`${cardClass} space-y-4`}>
      <h3 className="text-sm font-semibold">{uk.eventTypes}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">{uk.noEventTypes}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 first:border-t-0 first:pt-0"
            >
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-zinc-500">
                  /u/{username}/{item.slug} · {item.durationMinutes} {uk.durationMinutes} ·{' '}
                  {item.isActive ? uk.active : uk.inactive}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  className={ghostButtonClass}
                  onClick={() => {
                    setEditingId(item.id)
                    setForm({
                      title: item.title,
                      slug: item.slug,
                      durationMinutes: String(item.durationMinutes),
                    })
                  }}
                >
                  {uk.edit}
                </button>
                <button
                  type="button"
                  className={ghostButtonClass}
                  onClick={() => void toggleActive(item)}
                >
                  {item.isActive ? uk.disableEvent : uk.enableEvent}
                </button>
                <button
                  type="button"
                  className={ghostButtonClass}
                  onClick={() => void copyLink(item)}
                >
                  {copiedId === item.id ? uk.copied : uk.copyLink}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit} className="space-y-3 border-t border-zinc-100 pt-4">
        <label className="block">
          <span className={fieldLabelClass}>{uk.eventTitle}</span>
          <input
            className={inputClass}
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={fieldLabelClass}>{uk.slug}</span>
            <input
              className={inputClass}
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              required
            />
          </label>
          <label className="block">
            <span className={fieldLabelClass}>{uk.duration}</span>
            <input
              type="number"
              min={5}
              max={480}
              className={inputClass}
              value={form.durationMinutes}
              onChange={(event) =>
                setForm({ ...form, durationMinutes: event.target.value })
              }
              required
            />
          </label>
        </div>
        {errorKey ? <p className="text-sm text-red-600">{uk[errorKey]}</p> : null}
        <div className="flex gap-2">
          <button type="submit" className={`${primaryButtonClass} sm:w-auto`}>
            {editingId ? uk.save : uk.create}
          </button>
          {editingId ? (
            <button
              type="button"
              className={ghostButtonClass}
              onClick={() => {
                setEditingId(null)
                setForm(emptyForm)
              }}
            >
              {uk.cancel}
            </button>
          ) : null}
        </div>
      </form>
    </section>
  )
}
