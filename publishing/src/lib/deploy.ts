import { contentClient } from '../../../lib/publishing/query'
import { eventId, requiredSecret, type PublishingEvent } from './webhook'

const repository = 'edengloria/dong-ha_page', workflow = 'deploy.yml'
export interface DeploymentRecord { _id: string; _rev: string; status: string; receivedAt: string; leaseUntil?: number; documentId: string; runId?: number; runUrl?: string; operation: string }
export const deploymentClient = () => contentClient(requiredSecret('SANITY_DEPLOY_TOKEN')).withConfig({ perspective: 'raw' })
async function github(path: string, body?: unknown) {
  const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, {
    method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${requiredSecret('GITHUB_DEPLOY_TOKEN')}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`GitHub request failed (${response.status})`)
  return response.status === 204 ? {} : response.json()
}

/** Persistent revision-locked claim: concurrent/repeated deliveries share one deployment. */
export async function dispatchPublication(event: PublishingEvent, dependencies = { client: deploymentClient(), request: github }) {
  const { client, request } = dependencies, key = eventId(event), id = `publishingEvent.${key}`
  const record = await client.createIfNotExists({ _id: id, _type: 'publishingEvent', event, documentId: event.id, operation: event.operation, status: 'received', receivedAt: new Date().toISOString(), leaseUntil: 0 }) as unknown as DeploymentRecord
  if (['queued', 'building', 'complete', 'failed'].includes(record.status)) return { key, duplicate: true, status: record.status }
  if ((record.leaseUntil || 0) > Date.now()) throw new Error('Delivery is already being processed; retry shortly')
  try {
    await client.patch(id).ifRevisionId(record._rev).set({ status: 'dispatching', leaseUntil: Date.now() + 30_000 }).commit()
  } catch { throw new Error('Another delivery claimed this event; retry shortly') }
  try {
    // A prior request may have reached GitHub even if its HTTP response was lost.
    const existing = record.status !== 'received' ? (await request(`actions/workflows/${workflow}/runs?event=workflow_dispatch&per_page=100`)).workflow_runs.find((run: { display_title: string }) => run.display_title === `CMS ${key}`) : undefined
    const run = existing || await request(`actions/workflows/${workflow}/dispatches`, { ref: 'main', inputs: { cms_event: key } })
    const current = await client.getDocument<DeploymentRecord>(id)
    if (current?.status === 'dispatching') await client.patch(id).ifRevisionId(current._rev).set({ status: 'queued', leaseUntil: 0, runId: run.workflow_run_id || run.id || null, runUrl: run.html_url || null }).commit()
    return { key, duplicate: Boolean(existing), status: 'queued' }
  } catch (error) {
    const current = await client.getDocument<DeploymentRecord>(id)
    if (current?.status === 'dispatching') await client.patch(id).ifRevisionId(current._rev).set({ status: 'retrying', leaseUntil: 0, message: 'Deployment request could not be confirmed. Waiting for webhook retry.' }).commit()
    throw error
  }
}
