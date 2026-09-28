import type { APIRoute } from 'astro'
import { verifySignature, readSmallBody, requiredSecret } from '../../lib/webhook'
import { deploymentClient, type DeploymentRecord } from '../../lib/deploy'

export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }
  try {
    const body = await readSmallBody(request)
    if (!await verifySignature(body, request.headers.get('x-dhsh-signature'), requiredSecret('DEPLOY_CALLBACK_SECRET'))) return new Response('Invalid signature', { status: 401, headers })
    const event = JSON.parse(body)
    if (!/^[a-f0-9]{64}$/.test(event.eventId || '') || !['building', 'complete', 'failed'].includes(event.status) || !/^\d+$/.test(String(event.runId))) return new Response('Invalid status', { status: 400, headers })
    const client = deploymentClient(), id = `publishingEvent.${event.eventId}`, current = await client.getDocument<DeploymentRecord>(id)
    if (!current) return new Response('Unknown event', { status: 404, headers })
    // A delayed start callback must not replace the terminal result.
    if (['complete', 'failed'].includes(current.status) && event.status === 'building') return new Response('Already finished', { headers })
    if (event.status === 'complete') {
      const live = await fetch(`https://dhsh.in/publishing-manifest.json?run=${event.runId}`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) })
      if (!live.ok || (await live.json()).buildId !== String(event.runId)) return new Response('Deployment not yet visible', { status: 503, headers })
    }
    await client.patch(id).ifRevisionId(current._rev).set({ status: event.status, leaseUntil: 0, runId: Number(event.runId), runUrl: `https://github.com/edengloria/dong-ha_page/actions/runs/${event.runId}`, completedAt: event.status === 'building' ? null : new Date().toISOString() }).commit()
    return new Response('Status recorded', { headers })
  } catch { return new Response('Status temporarily unavailable', { status: 503, headers }) }
}
