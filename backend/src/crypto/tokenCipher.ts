import crypto from 'node:crypto'

function encryptionKey() {
  const hex = process.env.TOKEN_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 64 hex characters')
  }

  return Buffer.from(hex, 'hex')
}

export function encryptToken(plain: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptToken(payload: string) {
  const buffer = Buffer.from(payload, 'base64')
  const iv = buffer.subarray(0, 12)
  const tag = buffer.subarray(12, 28)
  const encrypted = buffer.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}
