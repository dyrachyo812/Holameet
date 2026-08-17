const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/
const minDuration = 5
const maxDuration = 480
const maxTitleLength = 80

export function parseSlug(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  const slug = value.trim()
  if (!slugPattern.test(slug) || slug.length > 64) {
    return undefined
  }

  return slug
}

export function parseTitle(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  const title = value.trim()
  if (!title || title.length > maxTitleLength) {
    return undefined
  }

  return title
}

export function parseDuration(value: unknown) {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return undefined
  }

  if (value < minDuration || value > maxDuration) {
    return undefined
  }

  return value
}
