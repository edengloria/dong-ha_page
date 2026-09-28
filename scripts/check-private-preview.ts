/** Exercise the real Sanity-secret -> HttpOnly-session -> Astro draft flow. */
import assert from 'node:assert/strict'
import { getCliClient } from 'sanity/cli'
import { createPreviewSecret } from '@sanity/preview-url-secret/create-secret'
import { apiVersion } from '../lib/publishing/types'

const origin = process.env.PREVIEW_ORIGIN || 'http://127.0.0.1:4322'
const client = getCliClient({ apiVersion })
const anonymous = await fetch(`${origin}/preview/authoring-proof-asm/`)
assert.equal(anonymous.status, 401)
assert(!((await anonymous.text()).includes('Gaussian')))
const { secret } = await createPreviewSecret(client, 'dhsh-integration-test', 'http://127.0.0.1:3333')
const url = new URL('/api/preview/', origin)
url.searchParams.set('sanity-preview-secret', secret)
url.searchParams.set('sanity-preview-pathname', '/preview/authoring-proof-asm/')
const enabled = await fetch(url, { redirect: 'manual' })
assert.equal(enabled.status, 303)
assert.equal(enabled.headers.get('location'), '/preview/authoring-proof-asm/')
const cookie = enabled.headers.get('set-cookie')!
assert(cookie.includes('HttpOnly'))
const response = await fetch(`${origin}/preview/authoring-proof-asm/`, { headers: { cookie: cookie.split(';')[0] } })
assert.equal(response.status, 200)
assert.match(response.headers.get('cache-control') || '', /no-store/)
assert.match(response.headers.get('x-robots-tag') || '', /noindex/)
const html = await response.text()
for (const marker of ['Angular Spectrum Method', 'Gaussian', 'katex', 'shiki', 'References', '<table>', '<h2', 'Figure 1']) assert(html.includes(marker), `Missing statically rendered ${marker}`)
const invalid = new URL(url); invalid.searchParams.set('sanity-preview-secret', 'invalid')
assert.equal((await fetch(invalid, { redirect: 'manual' })).status, 401)
console.log('Private preview passed: anonymous denied; Sanity secret validated; HttpOnly session; complete Astro HTML; no-store/noindex; invalid secret denied.')
