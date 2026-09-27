/** Owner-authenticated setup. Secrets are written only to ignored server env files. */
import { getCliClient } from 'sanity/cli'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { apiVersion, dataset, projectId } from '../lib/publishing/types'
import { publishingTypes } from '../publishing/src/lib/webhook'

async function setup() {
const client = getCliClient({ apiVersion }), path = resolve('../publishing/.env.local')
let env = await readFile(path, 'utf8')
const value = (name: string) => env.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1]?.trim()
if (!value('SANITY_DEPLOY_TOKEN')) {
  const token = await client.request<{ key: string }>({ url: `/projects/${projectId}/tokens`, method: 'POST', useGlobalApi: true, body: { label: 'dhsh server publishing status', roleName: 'editor' } })
  env += `\nSANITY_DEPLOY_TOKEN=${token.key}\n`
}
for (const name of ['SANITY_WEBHOOK_SECRET', 'DEPLOY_CALLBACK_SECRET']) if (!value(name)) env += `${name}=${randomBytes(48).toString('base64url')}\n`
await writeFile(path, env, { mode: 0o600 })
execFileSync('gh', ['secret', 'set', 'DEPLOY_CALLBACK_SECRET', '--repo', 'edengloria/dong-ha_page'], { input: value('DEPLOY_CALLBACK_SECRET'), stdio: ['pipe', 'ignore', 'pipe'] })

const name = 'dhsh static publishing', hooks = await client.request<{ id: string; name: string }[]>({ url: `/hooks/projects/${projectId}` })
const existing = hooks.find(hook => hook.name === name)
const configuration = {
  type: 'document', name, dataset, url: 'https://studio.dhsh.in/api/sanity-webhook/', httpMethod: 'POST', apiVersion: `v${apiVersion}`,
  includeDrafts: false, includeAllVersions: false, isDisabledByUser: process.env.ENABLE_PUBLISHING_WEBHOOK !== '1', secret: value('SANITY_WEBHOOK_SECRET'),
  rule: {
    on: ['create', 'update', 'delete'],
    filter: `_type in ${JSON.stringify(publishingTypes)} && !(_id in path("drafts.**")) && !(_id in path("versions.**")) && !defined(migratedTo)`,
    projection: `{ "id": coalesce(after()._id, before()._id), "type": coalesce(after()._type, before()._type), "revision": coalesce(after()._rev, before()._rev), "operation": delta::operation(), "projectId": "${projectId}", "dataset": "${dataset}" }`,
  },
}
await client.request({ url: `/hooks/projects/${projectId}${existing ? `/${existing.id}` : ''}`, method: existing ? 'PATCH' : 'POST', body: configuration })
console.log(`Publishing secrets saved locally; GitHub callback secret set; webhook ${configuration.isDisabledByUser ? 'configured but disabled until hosting is ready' : 'enabled'}.`)
}
try { await setup() } catch (error) {
  // Sanity HTTP error objects may include the request body (webhook secret).
  console.error('Publishing service setup failed:', error instanceof Error ? error.name : 'Unknown error', (error as { statusCode?: number })?.statusCode || '')
  let message = error instanceof Error ? error.message : ''
  const env = await readFile(resolve('../publishing/.env.local'), 'utf8').catch(() => '')
  for (const line of env.split(/\r?\n/)) { const value = line.slice(line.indexOf('=') + 1).trim(); if (value.length > 16) message = message.replaceAll(value, '[redacted]') }
  console.error(message.slice(0, 600))
  process.exitCode = 1
}
