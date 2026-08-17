import { describe, expect, it } from 'vitest'
import { parseDuration, parseSlug, parseTitle } from './parseEventType.js'

describe('parseEventType', () => {
  it('accepts a kebab-case slug', () => {
    expect(parseSlug('consult-30')).toBe('consult-30')
  })

  it('rejects uppercase and spaces in slug', () => {
    expect(parseSlug('Consult')).toBeUndefined()
    expect(parseSlug('my event')).toBeUndefined()
  })

  it('rejects empty title and too-long title', () => {
    expect(parseTitle('  ')).toBeUndefined()
    expect(parseTitle('a'.repeat(81))).toBeUndefined()
    expect(parseTitle('  Consult  ')).toBe('Consult')
  })

  it('accepts duration within 5–480 minutes', () => {
    expect(parseDuration(30)).toBe(30)
    expect(parseDuration(4)).toBeUndefined()
    expect(parseDuration(481)).toBeUndefined()
    expect(parseDuration(30.5)).toBeUndefined()
  })
})
