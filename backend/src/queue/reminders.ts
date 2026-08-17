import { Queue, Worker } from 'bullmq'
import { DateTime } from 'luxon'
import { sendReminder } from '../telegram/notify.js'
import { createRedis, reminderQueueName } from './connection.js'
import { parseReminderOffsets, reminderDelayMs } from './reminderDelay.js'

type ReminderJob = {
  bookingId: string
  offsetMinutes: number
}

let queue: Queue<ReminderJob> | null = null

function reminderQueue() {
  if (!queue) {
    queue = new Queue<ReminderJob>(reminderQueueName, { connection: createRedis() })
  }

  return queue
}

export async function scheduleReminders(bookingId: string, startUtc: DateTime) {
  const offsets = parseReminderOffsets(process.env.REMINDER_OFFSET_MINUTES)
  const smallest = Math.min(...offsets)
  if (!Number.isFinite(smallest)) {
    return
  }

  const now = DateTime.utc()
  for (const offsetMinutes of offsets) {
    const delay = reminderDelayMs(startUtc, offsetMinutes, now, smallest)
    if (delay === null) {
      continue
    }

    try {
      await reminderQueue().add(
        'reminder',
        { bookingId, offsetMinutes },
        {
          jobId: `${bookingId}-${offsetMinutes}`,
          delay,
          attempts: 5,
          backoff: { type: 'exponential', delay: 4000 },
          removeOnComplete: true,
        },
      )
    } catch {
      continue
    }
  }
}

export function startReminderWorker() {
  const worker = new Worker<ReminderJob>(
    reminderQueueName,
    async (job) => {
      const ok = await sendReminder(job.data.bookingId, job.data.offsetMinutes)
      if (!ok) {
        throw new Error('telegram send failed')
      }
    },
    { connection: createRedis(), concurrency: 4 },
  )
  worker.on('error', (error) => {
    console.error('Reminder worker error', error.message)
  })
  return worker
}
