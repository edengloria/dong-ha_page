import type { APIRoute } from 'astro'
import { SIGNATURE_HEADER_NAME } from '@sanity/webhook'
import { verifySignature, parseEvent, readSmallBody, requiredSecret } from '../../lib/webhook'
import { dispatchPublication } from '../../lib/deploy'

export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }
  let body: string
  try { body = await readSmallBody(request) } catch { return new Response('Payload too large', { status: 413, headers }) }
  try {
    if (!await verifySignature(body, request.headers.get(SIGNATURE_HEADER_NAME), requiredSecret('SANITY_WEBHOOK_SECRET'))) return new Response('Invalid signature', { status: 401, headers })
    const event = parseEvent(body)
    if (!event) return new Response('Invalid publishing event', { status: 400, headers })
    const result = await dispatchPublication(event)
    return Response.json(result, { status: 202, headers })
  } catch (error) {
    console.error('Publishing webhook unavailable:', error instanceof Error && error.message.startsWith('Missing server configuration:') ? error.message : error instanceof Error ? error.name : 'Unknown error')
    return new Response('Deployment temporarily unavailable; retry delivery.', { status: 503, headers: { ...headers, 'Retry-After': '30' } })
  }
}
