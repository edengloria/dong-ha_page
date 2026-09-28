import type { APIRoute } from 'astro'
import { CommentError, listComments, mutateComment, parseComment } from '../../lib/comments'
import { readSmallBody } from '../../lib/webhook'
import { commentError, languageOf, type Language } from '../../../../lib/publishing/language'
const origins = new Set(['https://dhsh.in', 'https://www.dhsh.in', 'https://studio.dhsh.in'])
if (import.meta.env.DEV || process.env.COMMENTS_LOCAL_TEST === '1') for (const host of ['localhost', '127.0.0.1']) for (const port of [3100, 3111, 4321, 4322]) origins.add(`http://${host}:${port}`)
const headers = (request: Request) => ({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin', ...(origins.has(request.headers.get('origin') || '') ? { 'Access-Control-Allow-Origin': request.headers.get('origin')! } : {}) })
export const OPTIONS: APIRoute = ({ request }) => new Response(null, { status: origins.has(request.headers.get('origin') || '') ? 204 : 403, headers: { ...headers(request), 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Accept' } })
function failure(error: unknown, request: Request, language: Language) {
  return Response.json({ error: commentError(error instanceof CommentError ? error.code : 'service', language) }, { status: error instanceof CommentError ? error.status : 503, headers: headers(request) })
}
export const GET: APIRoute = async ({ request, url }) => {
  try { return Response.json(await listComments(url.searchParams.get('thread') || '', url.searchParams.get('before') || ''), { headers: headers(request) }) }
  catch (error) { return failure(error, request, languageOf(url.searchParams.get('language'))) }
}
export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!origins.has(request.headers.get('origin') || '')) return Response.json({ error: commentError('origin', 'en') }, { status: 403, headers: headers(request) })
  let thread = 'guestbook'
  let language: Language = 'en'
  const json = request.headers.get('accept')?.includes('application/json')
  try {
    const type = request.headers.get('content-type')?.split(';')[0]
    if (type !== 'application/x-www-form-urlencoded' && type !== 'application/json') throw new CommentError(415, 'format')
    let raw: string
    try { raw = await readSmallBody(request, 65_536) } catch { throw new CommentError(413, 'size') }
    let values: Record<string, unknown>
    try { values = type === 'application/json' ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw)) } catch { throw new CommentError(400, 'input') }
    if (!values || typeof values !== 'object' || Array.isArray(values)) throw new CommentError(400, 'input')
    language = languageOf(values.language)
    const input = parseComment(values); thread = input.thread
    // On Vercel, use its overwritten client-IP header, never user X-Forwarded-For.
    const ip = process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() : clientAddress
    if (!ip) throw new CommentError(503, 'service')
    const result = await mutateComment(input, ip)
    if (json) return Response.json(result, { status: input.action === 'create' ? 201 : 200, headers: headers(request) })
    return new Response(null, { status: 303, headers: { ...headers(request), Location: `/comments/?thread=${encodeURIComponent(thread)}&language=${language}&done=1` } })
  } catch (error) {
    if (json) return failure(error, request, language)
    const message = commentError(error instanceof CommentError ? error.code : 'service', language)
    return new Response(null, { status: 303, headers: { ...headers(request), Location: `/comments/?thread=${encodeURIComponent(thread)}&language=${language}&error=${encodeURIComponent(message)}` } })
  }
}
