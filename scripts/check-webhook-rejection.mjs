import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { encodeSignatureHeader } from '@sanity/webhook'
const env = await readFile(new URL('../publishing/.env.local', import.meta.url), 'utf8')
const secret = env.match(/^SANITY_WEBHOOK_SECRET=(.+)$/m)?.[1].trim()
assert(secret, 'Local webhook secret is missing')
const endpoint = 'http://127.0.0.1:4322/api/sanity-webhook/'
const body = JSON.stringify({ id: 'drafts.private-post', type: 'post', operation: 'update', revision: 'v1', projectId: 'f0xserx3', dataset: 'production' })
const send = (payload, signature) => fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(signature ? { 'sanity-webhook-signature': signature } : {}) }, body: payload })
assert.equal((await send(body)).status, 401)
assert.equal((await send(body, await encodeSignatureHeader(body, Date.now(), secret))).status, 400)
assert.equal((await send(body, await encodeSignatureHeader(body, Date.now() - 360_000, secret))).status, 401)
assert.equal((await send('x'.repeat(17_000))).status, 413)
console.log('Live webhook endpoint rejects unsigned, draft, stale and oversized payloads without triggering a deployment.')
