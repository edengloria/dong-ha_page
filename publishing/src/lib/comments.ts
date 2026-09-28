import { createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { SanityClient } from '@sanity/client'
import { contentClient } from '../../../lib/publishing/query'
import { commentError, type CommentErrorCode } from '../../../lib/publishing/language'
import { requiredSecret } from './webhook'

const derive = promisify(scrypt)
export const commentClient = () => contentClient(requiredSecret('SANITY_DEPLOY_TOKEN')).withConfig({ perspective: 'raw' })
export class CommentError extends Error {
  constructor(public status: number, public code: CommentErrorCode) { super(commentError(code, 'en')) }
}
export interface CommentInput { action: 'create' | 'delete'; thread: string; name: string; message: string; password: string; id: string; website: string }
export interface PublicComment { _id: string; name: string; message: string; createdAt: string }
interface StoredComment extends PublicComment { _rev: string; thread: string; salt: string; passwordHash: string }
const idPattern = /^blogComment\.[a-f0-9-]{36}$/
export function validThread(value: unknown): value is string {
  return typeof value === 'string' && (value === 'guestbook' || /^post:[a-zA-Z0-9_-]{1,100}$/.test(value))
}
export function parseComment(value: Record<string, unknown>): CommentInput {
  const string = (key: string) => typeof value[key] === 'string' ? value[key] as string : ''
  const input = { action: string('action'), thread: string('thread'), name: string('name').trim(), message: string('message').trim(), password: string('password'), id: string('id'), website: string('website') }
  if (!validThread(input.thread) || !['create', 'delete'].includes(input.action)) throw new CommentError(400, 'request')
  if (input.password.length < 4 || input.password.length > 128) throw new CommentError(400, 'password')
  if (input.action === 'create' && (!input.name || input.name.length > 60 || !input.message || input.message.length > 4000 || /[\x00-\x1f\x7f]/.test(input.name) || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(input.message))) throw new CommentError(400, 'content')
  if (input.action === 'delete' && !idPattern.test(input.id)) throw new CommentError(400, 'id')
  return input as CommentInput
}
function keyed(value: string, secret: string) { return createHmac('sha256', secret).update(`dhsh-comments-v1:${value}`).digest('hex') }
export async function hashPassword(password: string, salt: string, secret: string) {
  return (await derive(keyed(`password:${password}`, secret), salt, 64) as Buffer).toString('hex')
}
export async function verifyPassword(password: string, salt: string, hash: string, secret: string) {
  if (!/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(hash)) return false
  return timingSafeEqual(Buffer.from(await hashPassword(password, salt, secret), 'hex'), Buffer.from(hash, 'hex'))
}
export async function threadPath(thread: string, client: SanityClient): Promise<string> {
  if (!validThread(thread)) throw new CommentError(400, 'thread')
  if (thread === 'guestbook') return '/blog/'
  // Query the published root document explicitly; a draft never opens a public thread.
  const post = await client.fetch<{ language: string; slug: string } | null>('*[_type == "post" && _id == $id && defined(publishedAt)][0]{language, "slug": slug.current}', { id: thread.slice(5) })
  if (!post || !['ko', 'en'].includes(post.language) || !/^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u.test(post.slug)) throw new CommentError(404, 'post')
  return `/blog/${post.language}/${encodeURIComponent(post.slug)}/`
}
/** Dot-path IDs are private under Sanity's fixed unauthenticated read rules. */
export async function takeCommentRate(client: SanityClient, key: string, limit: number, windowMs: number, secret: string, now = Date.now()) {
  const id = `blogRate.${keyed(`rate:${key}`, secret)}`
  for (let attempt = 0; attempt < 4; attempt++) {
    const row = await client.createIfNotExists({ _id: id, _type: 'blogRate', count: 0, resetAt: 0 })
    const count = Number(row.resetAt) > now ? Number(row.count) : 0
    if (count >= limit) throw new CommentError(429, 'rate')
    try {
      await client.patch(id).ifRevisionId(row._rev).set({ count: count + 1, resetAt: count ? row.resetAt : now + windowMs, expiresAt: new Date(now + 2 * 86400_000).toISOString() }).commit()
      return
    } catch (error) { if ((error as { statusCode?: number }).statusCode !== 409) throw error }
  }
  throw new CommentError(429, 'rate')
}
export async function listComments(thread: string, before = '', client = commentClient()) {
  await threadPath(thread, client)
  if (before && !/^\d{4}-\d\d-\d\dT[\d:.]+Z\|blogComment\.[a-f0-9-]{36}$/.test(before)) throw new CommentError(400, 'page')
  const [time = '', id = ''] = before.split('|')
  const rows = await client.fetch<PublicComment[]>(`*[_type == "blogComment" && _id in path("blogComment.*") && thread == $thread && !defined(deletedAt) && ($time == "" || createdAt < $time || (createdAt == $time && _id < $id))] | order(createdAt desc, _id desc)[0...31]{_id, name, message, createdAt}`, { thread, time, id })
  const entries = rows.slice(0, 30), last = entries.at(-1)
  return { entries, next: rows.length > 30 && last ? `${last.createdAt}|${last._id}` : null }
}
export async function mutateComment(input: CommentInput, ip: string, client = commentClient(), secret = requiredSecret('PREVIEW_SESSION_SECRET')) {
  // No raw IPs, passwords or request bodies are stored in logs or rate documents.
  await takeCommentRate(client, `attempt:${ip}`, 10, 60_000, secret)
  if (input.website) throw new CommentError(400, 'save')
  await threadPath(input.thread, client)
  if (input.action === 'delete') {
    await takeCommentRate(client, `delete:${input.id}`, 10, 60_000, secret)
    const row = await client.getDocument<StoredComment>(input.id)
    if (!row || row.thread !== input.thread || !await verifyPassword(input.password, row.salt || '', row.passwordHash || '', secret)) throw new CommentError(403, 'credentials')
    // Clear visitor content and credentials atomically; the empty tombstone is not listed.
    await client.patch(row._id).ifRevisionId(row._rev).set({ deletedAt: new Date().toISOString() }).unset(['name', 'message', 'salt', 'passwordHash']).commit()
    return { deleted: true }
  }
  await takeCommentRate(client, `create-minute:${ip}`, 3, 60_000, secret)
  await takeCommentRate(client, `create-day:${ip}`, 20, 86400_000, secret)
  await takeCommentRate(client, 'create-global', 200, 86400_000, secret)
  const salt = randomBytes(16).toString('hex'), id = `blogComment.${randomUUID()}`
  await client.create({ _id: id, _type: 'blogComment', thread: input.thread, name: input.name, message: input.message, createdAt: new Date().toISOString(), salt, passwordHash: await hashPassword(input.password, salt, secret) })
  return { id }
}
