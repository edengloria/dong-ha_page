import { createHmac, timingSafeEqual } from 'node:crypto'

export const cookieName = 'dhsh-preview'
export function sessionSecret() {
  const key = process.env.PREVIEW_SESSION_SECRET || import.meta.env?.PREVIEW_SESSION_SECRET
  if (!key || key.length < 32) throw new Error('Preview session secret is not configured')
  return key
}
export function readToken() {
  const token = process.env.SANITY_READ_TOKEN || import.meta.env?.SANITY_READ_TOKEN
  if (!token) throw new Error('Draft read token is not configured')
  return token
}
export function createSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 30 * 60_000 })).toString('base64url')
  return `${payload}.${createHmac('sha256', sessionSecret()).update(payload).digest('base64url')}`
}
export function validSession(cookie?: string) {
  if (!cookie || cookie.length > 512) return false
  try {
    const parts = cookie.split('.')
    const [payload, signature] = parts
    if (parts.length !== 2 || !payload || !signature) return false
    const expected = createHmac('sha256', sessionSecret()).update(payload).digest()
    const actual = Buffer.from(signature, 'base64url')
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return typeof data.exp === 'number' && data.exp > Date.now() && data.exp <= Date.now() + 30 * 60_000
  } catch { return false }
}
