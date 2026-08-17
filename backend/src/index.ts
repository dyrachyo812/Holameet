import './loadEnv.js'
import { createApp } from './app.js'

const port = Number(process.env.BACKEND_PORT) || 3000
const server = createApp().listen(port, () => {
  console.error(`Backend listening on ${port}`)
  void startBackground()
})
server.on('error', (error) => {
  console.error(error)
  process.exit(1)
})

async function startBackground() {
  const { startReminderWorker } = await import('./queue/reminders.js')
  const { startTelegramPoll } = await import('./telegram/poll.js')
  startReminderWorker()
  void startTelegramPoll()
}
