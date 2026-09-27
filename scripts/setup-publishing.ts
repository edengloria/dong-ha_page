/** Run with `sanity exec ../scripts/setup-publishing.ts --with-user-token` from studio/. */
import { getCliClient } from 'sanity/cli'
import { readFile, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { resolve } from 'node:path'
import { apiVersion, projectId } from '../lib/publishing/types'

const client = getCliClient({ apiVersion })
const path = resolve('../publishing/.env.local')
let env = await readFile(path, 'utf8').catch(() => readFile(resolve('../.env.local'), 'utf8').catch(() => ''))
if (!/^SANITY_READ_TOKEN=/m.test(env)) {
  const token = await client.request<{ key: string }>({ url: `/projects/${projectId}/tokens`, method: 'POST', useGlobalApi: true, body: { label: 'dhsh private draft preview', roleName: 'viewer' } })
  env += `\nSANITY_READ_TOKEN=${token.key}\n`
}
if (!/^PREVIEW_SESSION_SECRET=/m.test(env)) env += `PREVIEW_SESSION_SECRET=${randomBytes(48).toString('base64url')}\n`
await writeFile(path, env, { mode: 0o600 })
await client.createIfNotExists({ _id: 'author.dong-ha-shin', _type: 'author', name: 'Dong-Ha Shin', url: 'https://dhsh.in/' })
const topics = [['optics', 'Optics'], ['ai', 'AI'], ['graphics-vision', 'Computer Graphics / Vision'], ['programming', 'Programming'], ['engineering', 'Engineering']]
for (const [slug, title] of topics) await client.createIfNotExists({ _id: `topic.${slug}`, _type: 'topic', title, slug: { _type: 'slug', current: slug } })
for (const title of ['Holography', 'Meta-optics', 'Differentiable Optics', 'PyTorch', 'CUDA', 'Unity', 'LLM', 'Computer Vision', 'Wave Optics', 'RCWA', 'CGH']) {
  const slug = title.toLowerCase().replaceAll(' ', '-')
  await client.createIfNotExists({ _id: `tag.${slug}`, _type: 'tag', title, slug: { _type: 'slug', current: slug } })
}
await client.createIfNotExists({ _id: 'site-settings', _type: 'siteSettings', blogTitle: 'Research & Engineering Notes', blogDescription: 'Notes on optics, AI, graphics, programming, and engineering.' })
console.log('Project seeded. Private preview credentials saved only to ignored .env.local; no secrets printed.')
