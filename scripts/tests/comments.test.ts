import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { SanityClient } from '@sanity/client'
import { CommentError, parseComment, validThread, hashPassword, verifyPassword, takeCommentRate, threadPath, mutateComment, listComments } from '../../publishing/src/lib/comments'

const secret = 'test-only-server-secret-not-a-production-value'
const input = { action: 'create', thread: 'guestbook', name: 'Visitor', message: '한글 test <script>alert(1)</script>', password: 'test-pass', id: '', website: '' }
function store() {
  const rows = new Map<string, Record<string, unknown>>(), queries: string[] = []
  let revision = 0
  const save = (row: Record<string, unknown>) => { const value = { ...row, _rev: String(++revision) }; rows.set(String(row._id), value); return structuredClone(value) }
  const client = {
    async create(row: Record<string, unknown>) { assert(!rows.has(String(row._id))); return save(row) },
    async createIfNotExists(row: Record<string, unknown>) { return structuredClone(rows.get(String(row._id)) || save(row)) },
    async getDocument(id: string) { return structuredClone(rows.get(id)) },
    async fetch(query: string, args: Record<string, string>) {
      queries.push(query)
      if (query.includes('_type == "post"')) return args.id === 'published-post' ? { language: 'ko', slug: 'stable-url' } : null
      return [...rows.values()].filter(row => row._type === 'blogComment' && row.thread === args.thread && !row.deletedAt)
        .map(({ _id, name, message, createdAt }) => ({ _id, name, message, createdAt }))
    },
    patch(id: string) {
      let expected = '', changes = {}, removals: string[] = []
      const patch = {
        ifRevisionId(rev: string) { expected = rev; return patch },
        set(value: object) { changes = value; return patch },
        unset(value: string[]) { removals = value; return patch },
        async commit() {
          const row = rows.get(id)
          if (row?._rev !== expected) throw Object.assign(new Error('Conflict'), { statusCode: 409 })
          const updated: Record<string, unknown> = { ...row, ...changes }; removals.forEach(key => { delete updated[key] })
          return save(updated)
        },
      }
      return patch
    },
  }
  return { rows, queries, client: client as unknown as SanityClient }
}
test('comment input rejects malformed scopes, oversize text and weak deletion credentials', () => {
  assert(validThread('guestbook')); assert(validThread('post:published-post'))
  for (const thread of ['post:drafts.secret', 'post:versions.secret', 'post:x" || true', '', '/blog/ko/test']) assert(!validThread(thread))
  for (const value of [{ ...input, password: 'abc' }, { ...input, message: 'x'.repeat(4001) }, { ...input, name: '\n' }, { ...input, action: 'delete', id: 'some-post' }]) assert.throws(() => parseComment(value), CommentError)
  assert.equal(parseComment(input).message, input.message)
})
test('password verification uses salted server-keyed scrypt and rejects wrong password/key', async () => {
  const salt = 'ab'.repeat(16), hash = await hashPassword('test-pass', salt, secret)
  assert(!hash.includes('test-pass'))
  assert(await verifyPassword('test-pass', salt, hash, secret))
  assert(!await verifyPassword('wrong-pass', salt, hash, secret))
  assert(!await verifyPassword('test-pass', salt, hash, 'different-secret'))
  assert(!await verifyPassword('test-pass', salt, 'broken', secret))
})
test('revision-locked rate limits enforce the cap under concurrent requests and reset', async () => {
  const { client, rows } = store()
  const attempts = await Promise.allSettled(Array.from({ length: 6 }, () => takeCommentRate(client, 'ip-test', 3, 1000, secret, 100)))
  assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 3)
  assert.equal([...rows.values()][0].count, 3)
  await takeCommentRate(client, 'ip-test', 3, 1000, secret, 1200)
  assert.equal([...rows.values()][0].count, 1)
  assert(!JSON.stringify([...rows.values()]).includes('ip-test'))
})
test('only published posts and the guestbook have public comment threads', async () => {
  const { client } = store()
  assert.equal(await threadPath('guestbook', client), '/blog/')
  assert.equal(await threadPath('post:published-post', client), '/blog/ko/stable-url/')
  await assert.rejects(threadPath('post:unpublished', client), (error: unknown) => error instanceof CommentError && error.status === 404)
})
test('create, per-post isolation, wrong-password rejection, and deletion clear private credentials', async () => {
  const { client, rows, queries } = store()
  const result = await mutateComment(parseComment(input), 'test-client', client, secret)
  assert('id' in result)
  const id = result.id!, row = rows.get(id)!
  assert.match(id, /^blogComment\./); assert(row.passwordHash); assert(!JSON.stringify(row).includes('test-pass'))
  assert.equal((await listComments('guestbook', '', client)).entries.length, 1)
  assert.equal((await listComments('post:published-post', '', client)).entries.length, 0)
  assert(!JSON.stringify(await listComments('guestbook', '', client)).includes('passwordHash'))
  assert(queries.some(query => query.includes('{_id, name, message, createdAt}')))
  await assert.rejects(mutateComment(parseComment({ ...input, action: 'delete', id, password: 'wrong-password' }), 'test-client', client, secret), (error: unknown) => error instanceof CommentError && error.status === 403)
  await assert.rejects(mutateComment(parseComment({ ...input, action: 'delete', id, thread: 'post:published-post' }), 'test-client', client, secret), (error: unknown) => error instanceof CommentError && error.status === 403)
  const articleComment = await mutateComment(parseComment({ ...input, thread: 'post:published-post', message: 'Article-only comment' }), 'test-client', client, secret)
  assert.equal((await listComments('post:published-post', '', client)).entries[0]._id, articleComment.id)
  assert.equal((await listComments('guestbook', '', client)).entries.length, 1)
  await mutateComment(parseComment({ ...input, action: 'delete', id }), 'test-client', client, secret)
  assert.equal((await listComments('guestbook', '', client)).entries.length, 0)
  assert.equal((await listComments('post:published-post', '', client)).entries.length, 1)
  for (const key of ['name', 'message', 'passwordHash', 'salt']) assert(!(key in rows.get(id)!))
})
test('honeypot and unknown post requests cannot create comment records', async () => {
  const { client, rows } = store()
  await assert.rejects(mutateComment(parseComment({ ...input, website: 'bot' }), 'bot', client, secret))
  await assert.rejects(mutateComment(parseComment({ ...input, thread: 'post:unpublished' }), 'bot', client, secret))
  assert(![...rows.values()].some(row => row._type === 'blogComment'))
})
