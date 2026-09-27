/** One-time migration of our known public seed records; preserves edits and old records. */
import { getCliClient } from 'sanity/cli'
import { apiVersion } from '../lib/publishing/types'

const client = getCliClient({ apiVersion }).withConfig({ perspective: 'raw' })
const ids = [
  'author.dong-ha-shin',
  ...['optics', 'ai', 'graphics-vision', 'programming', 'engineering'].map(id => `topic.${id}`),
  ...['holography', 'meta-optics', 'differentiable-optics', 'pytorch', 'cuda', 'unity', 'llm', 'computer-vision', 'wave-optics', 'rcwa', 'cgh'].map(id => `tag.${id}`),
  'reference.band-limited-asm', 'reference.pytorch-fft',
]
const mapping = Object.fromEntries(ids.map(id => [id, id.replace('.', '-')]))
const records = await client.fetch('*[_id in $ids && !defined(migratedTo)]', { ids })
const dependents = await client.fetch('*[references($ids)]', { ids })
let transaction = client.transaction()
for (const record of records) {
  const { _id, _rev, _createdAt: _created, _updatedAt: _updated, ...data } = record
  const existing = await client.getDocument(mapping[_id])
  if (existing) throw new Error(`Migration target already exists: ${mapping[_id]}; review before continuing`)
  transaction = transaction.create({ ...data, _id: mapping[_id] })
    .patch(_id, patch => patch.ifRevisionId(_rev).set({ migratedTo: mapping[_id] }))
}
function replace(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(replace)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, key === '_ref' && typeof item === 'string' ? mapping[item] || item : replace(item)]))
}
for (const document of dependents) {
  const { _id, _rev, _type: _type, _createdAt: _created, _updatedAt: _updated, ...content } = document
  transaction = transaction.patch(_id, patch => patch.ifRevisionId(_rev).set(replace(content) as Record<string, unknown>))
}
if (records.length || dependents.length) await transaction.commit()
console.log(`Migrated ${records.length} public seed records and ${dependents.length} linked documents; old records retained privately.`)
