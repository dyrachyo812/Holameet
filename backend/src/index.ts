import dotenv from 'dotenv'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)
dotenv.config({ path: path.join(rootDir, '.env') })

const app = express()
const port = Number(process.env.BACKEND_PORT) || 3000

app.get('/health', (request, response) => {
  response.json({ status: 'ok' })
})

app.listen(port)
