/** Read-only verification of an export restored into the private restore-check dataset. */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { getCliClient } from 'sanity/cli'
import { apiVersion, projectId, type Post } from '../lib/publishing/types'
import { postProjection } from '../lib/publishing/query'
import { renderBody } from '../lib/publishing/render'

const archive = process.env.PUBLISHING_BACKUP
assert(archive, 'Set PUBLISHING_BACKUP to the archive being verified')
const path = resolve(archive), bytes = await readFile(path)
const checksum = (await readFile(`${path}.sha256`, 'utf8')).trim().split(/\s+/)[0]
assert.equal(createHash('sha256').update(bytes).digest('hex'), checksum, 'Backup checksum mismatch')
const entries = execFileSync('tar', ['-tzf', path], { encoding: 'utf8' }).trim().split(/\r?\n/)
const dataEntry = entries.find(entry => entry.endsWith('/data.ndjson'))
assert(dataEntry, 'Archive must contain data.ndjson')
const documents = execFileSync('tar', ['-xOzf', path, dataEntry], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim().split(/\r?\n/).map(line => JSON.parse(line))
const assetsEntry = entries.find(entry => entry.endsWith('/assets.json'))
assert(assetsEntry, 'Archive must contain assets.json')
const assets = JSON.parse(execFileSync('tar', ['-xOzf', path, assetsEntry], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }))
const client = getCliClient({ apiVersion }).withConfig({ dataset: 'restore-check', perspective: 'raw' })
const restored = await client.fetch('*[!(_id in path("_.**"))]')
assert.equal(restored.length, documents.length + Object.keys(assets).length, 'Restored document and asset count differs')
const restoredById = new Map<string, Record<string, unknown>>(restored.map((document: { _id: string }) => [document._id, document]))
const content = (document: Record<string, unknown>) => Object.fromEntries(Object.entries(document).filter(([key]) => !['_rev', '_createdAt', '_updatedAt'].includes(key)))
function normalizeExport(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeExport)
  if (!value || typeof value !== 'object') return value
  const object = Object.fromEntries(Object.entries(value).filter(([key]) => key !== '_sanityAsset').map(([key, item]) => [key, normalizeExport(item)]))
  if ('_sanityAsset' in value) {
    const match = String(value._sanityAsset).match(/^(image|file)@file:\/\/\.\/(?:images|files)\/([a-f0-9]+(?:-\d+x\d+)?)\.([a-z0-9]+)$/)
    assert(match, 'Unsupported asset export marker')
    object.asset = { _type: 'reference', _ref: `${match[1]}-${match[2]}-${match[3]}` }
  }
  return object
}
let images = 0
for (const original of documents) {
  const actual = restoredById.get(original._id)
  assert(actual, `Missing restored document ${original._id}`)
  assert(isDeepStrictEqual(content(actual), normalizeExport(content(original))), `Restored content differs: ${original._id}`)
}
for (const actual of restoredById.values()) {
  if (actual._type === 'sanity.imageAsset' || actual._type === 'sanity.fileAsset') {
    const kind = actual._type === 'sanity.imageAsset' ? 'image' : 'file'
    const original = assets[`${kind}-${actual.sha1hash}`]
    assert(original, 'Unexpected restored asset')
    const url = new URL(String(actual.url))
    assert.equal(url.protocol, 'https:')
    assert.equal(url.hostname, 'cdn.sanity.io')
    assert(!url.username && !url.password && !url.port)
    assert(url.pathname.includes(`/${projectId}/restore-check/`), 'Restored asset still points at production')
    assert.equal(actual.sha1hash, original.sha1hash, 'Restored asset hash metadata differs')
    // Normal image delivery can strip metadata. Only authenticated dlRaw returns
    // the exact uploaded bytes whose hash appears in the export manifest.
    url.searchParams.set('dlRaw', 'original')
    const response = await fetch(url, { headers: { Authorization: `Bearer ${client.config().token}` }, redirect: 'error', signal: AbortSignal.timeout(15_000) })
    assert(response.ok, 'Restored asset cannot be downloaded')
    assert.equal(createHash('sha1').update(Buffer.from(await response.arrayBuffer())).digest('hex'), original.sha1hash, 'Restored asset bytes differ')
    if (actual._type === 'sanity.imageAsset') {
      assert(isDeepStrictEqual((actual.metadata as { dimensions: unknown }).dimensions, original.metadata.dimensions), 'Restored image dimensions differ')
      images++
    }
  }
}
const posts = await client.fetch<Post[]>(`*[_type == "post"]${postProjection}`)
for (const post of posts) {
  const rendered = await renderBody(post)
  assert(rendered.html.length, 'Restored article did not render')
  if (post._id === 'drafts.authoring-proof-asm') for (const marker of ['katex', 'shiki', '<table>', 'Figure 1']) assert(rendered.html.includes(marker), `Restored proof is missing ${marker}`)
}
const anonymous = await fetch(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/restore-check?query=${encodeURIComponent('count(*)')}`)
assert([401, 403, 404].includes(anonymous.status) || (anonymous.ok && (await anonymous.json()).result === 0), 'Restore dataset must not expose documents anonymously')
console.log(`Restore verified: ${documents.length} documents, ${images} original image hashes/dimensions, ${posts.length} rendered drafts; anonymous dataset access denied.`)
