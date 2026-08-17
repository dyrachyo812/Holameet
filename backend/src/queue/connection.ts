import Redis from 'ioredis'

export const reminderQueueName = 'holameet-reminders'

export function createRedis() {
  const url = process.env.REDIS_URL
  if (url) {
    return new Redis(url, { maxRetriesPerRequest: null })
  }

  return new Redis({
    host: '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
  })
}
