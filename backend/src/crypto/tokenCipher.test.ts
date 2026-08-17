import { describe, expect, it } from 'vitest'
import { decryptToken, encryptToken } from './tokenCipher.js'

describe('tokenCipher', () => {
  it('round-trips a token when the encryption key is set', () => {
    process.env.TOKEN_ENCRYPTION_KEY = 'a'.repeat(64)
    const packed = encryptToken('refresh-token-value')
    expect(decryptToken(packed)).toBe('refresh-token-value')
  })

  it('fails to decrypt tampered payload', () => {
    process.env.TOKEN_ENCRYPTION_KEY = 'a'.repeat(64)
    const packed = encryptToken('refresh-token-value')
    const buffer = Buffer.from(packed, 'base64')
    buffer[30] ^= 0xff
    expect(() => decryptToken(buffer.toString('base64'))).toThrow()
  })
})
