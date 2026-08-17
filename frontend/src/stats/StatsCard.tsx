import { useEffect, useState, type FormEvent } from 'react'
import { getStats } from '../api/client'
import { uk } from '../i18n/uk'
import { cardClass, fieldLabelClass, inputClass, primaryButtonClass } from '../ui/classes'

function isoDate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function defaultRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  return { from: isoDate(from), to: isoDate(to) }
}

export function StatsCard() {
  const initial = defaultRange()
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [count, setCount] = useState<number | null>(null)

  async function load(fromDate: string, toDate: string) {
    const result = await getStats({ from: fromDate, to: toDate })
    setCount(result.bookingsCount)
  }

  useEffect(() => {
    void load(initial.from, initial.to).catch(() => setCount(0))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      await load(from, to)
    } catch {
      setCount(0)
    }
  }

  return (
    <section className={`${cardClass} space-y-4`}>
      <h3 className="text-sm font-semibold">{uk.stats}</h3>
      <p className="text-2xl font-semibold tracking-tight">
        {count ?? '—'}
        <span className="ml-2 text-sm font-medium text-zinc-500">{uk.bookingsCount}</span>
      </p>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="block">
          <span className={fieldLabelClass}>{uk.statsFrom}</span>
          <input
            type="date"
            className={inputClass}
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className={fieldLabelClass}>{uk.statsTo}</span>
          <input
            type="date"
            className={inputClass}
            value={to}
            onChange={(event) => setTo(event.target.value)}
            required
          />
        </label>
        <button type="submit" className={`${primaryButtonClass} self-end sm:w-auto`}>
          {uk.showStats}
        </button>
      </form>
    </section>
  )
}
