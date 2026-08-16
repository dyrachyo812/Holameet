import bcrypt from 'bcrypt'

const hashRounds = 12

export function hashPassword(password: string) {
  return bcrypt.hash(password, hashRounds)
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}
