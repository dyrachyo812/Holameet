import { OAuth2Client } from 'google-auth-library'

const scopes = [
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/calendar.events',
]

export function googleEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  const appOrigin = process.env.APP_ORIGIN
  if (!clientId || !clientSecret || !redirectUri || !appOrigin) {
    return null
  }

  return { clientId, clientSecret, redirectUri, appOrigin }
}

export function createGoogleClient() {
  const env = googleEnv()
  if (!env) {
    return null
  }

  return new OAuth2Client(env.clientId, env.clientSecret, env.redirectUri)
}

export function googleAuthUrl(client: OAuth2Client, state: string) {
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
    state,
  })
}
