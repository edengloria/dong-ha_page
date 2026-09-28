import { createHash, timingSafeEqual } from 'node:crypto'
import { decodeSignatureHeader, encodeSignatureHeader } from '@sanity/webhook'
import { dataset, projectId } from '../../../lib/publishing/types'

export interface PublishingEvent { id: string; type: string; operation: 'create' | 'update' | 'delete'; revision: string; projectId: string; dataset: string }
export const publishingTypes = ['post', 'topic', 'tag', 'series', 'author', 'referenceRecord', 'siteSettings']

export async function verifySignature(body: string, signature: string | null, secret: string, now = Date.now()) {
  if (!signature || secret.length < 32 || body.length > 16_384) return false
  try {
    const { timestamp } = decodeSignatureHeader(signature)
    // Library validates HMAC format, but does not enforce timestamp freshness.
    if (Math.abs(now - timestamp) > 5 * 60_000) return false
    const expected = Buffer.from(await encodeSignatureHeader(body, timestamp, secret))
    const received = Buffer.from(signature)
    return expected.length === received.length && timingSafeEqual(expected, received)
  } catch { return false }
}
export function parseEvent(body: string): PublishingEvent | null {
  try {
    const event = JSON.parse(body)
    if (!event || event.projectId !== projectId || event.dataset !== dataset || !publishingTypes.includes(event.type)
      || !['create', 'update', 'delete'].includes(event.operation) || typeof event.id !== 'string' || !/^[a-zA-Z0-9_-]{1,150}$/.test(event.id)
      || typeof event.revision !== 'string' || !/^[a-zA-Z0-9_-]{1,150}$/.test(event.revision)) return null
    return { id: event.id, type: event.type, operation: event.operation, revision: event.revision, projectId, dataset }
  } catch { return null }
}
export function eventId(event: PublishingEvent) {
  return createHash('sha256').update([projectId, dataset, event.id, event.revision, event.operation].join(':')).digest('hex')
}
export function requiredSecret(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing server configuration: ${name}`)
  return value
}
export async function readSmallBody(request: Request, maximum = 16_384) {
  if (Number(request.headers.get('content-length')) > maximum) throw new Error('Payload too large')
  const reader = request.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > maximum) { await reader.cancel(); throw new Error('Payload too large') }
      chunks.push(value)
    }
    return Buffer.concat(chunks).toString('utf8')
  } finally { reader.releaseLock() }
}
