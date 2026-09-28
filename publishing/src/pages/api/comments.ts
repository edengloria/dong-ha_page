import type { APIRoute } from 'astro'
import { CommentError, listComments, mutateComment, parseComment } from '../../lib/comments'
import { readSmallBody } from '../../lib/webhook'
const origins = new Set(['https://dhsh.in', 'https://www.dhsh.in', 'https://studio.dhsh.in'])
if (import.meta.env.DEV || process.env.COMMENTS_LOCAL_TEST === '1') for (const host of ['localhost', '127.0.0.1']) for (const port of [3100, 3111, 4321, 4322]) origins.add(`http://${host}:${port}`)
const headers = (request: Request) => ({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin', ...(origins.has(request.headers.get('origin') || '') ? { 'Access-Control-Allow-Origin': request.headers.get('origin')! } : {}) })
export const OPTIONS: APIRoute = ({ request }) => new Response(null, { status: origins.has(request.headers.get('origin') || '') ? 204 : 403, headers: { ...headers(request), 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Accept' } })
function failure(error: unknown, request: Request) {
  return Response.json({ error: error instanceof CommentError ? error.message : '댓글 서비스를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.' }, { status: error instanceof CommentError ? error.status : 503, headers: headers(request) })
}
export const GET: APIRoute = async ({ request, url }) => {
  try { return Response.json(await listComments(url.searchParams.get('thread') || '', url.searchParams.get('before') || ''), { headers: headers(request) }) }
  catch (error) { return failure(error, request) }
}
export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!origins.has(request.headers.get('origin') || '')) return Response.json({ error: '허용되지 않은 요청입니다.' }, { status: 403, headers: headers(request) })
  let thread = 'guestbook'
  const json = request.headers.get('accept')?.includes('application/json')
  try {
    const type = request.headers.get('content-type')?.split(';')[0]
    if (type !== 'application/x-www-form-urlencoded' && type !== 'application/json') throw new CommentError(415, '지원하지 않는 입력 형식입니다.')
    let raw: string
    try { raw = await readSmallBody(request, 65_536) } catch { throw new CommentError(413, '입력이 너무 큽니다.') }
    let values: Record<string, unknown>
    try { values = type === 'application/json' ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw)) } catch { throw new CommentError(400, '올바른 입력이 아닙니다.') }
    if (!values || typeof values !== 'object' || Array.isArray(values)) throw new CommentError(400, '올바른 입력이 아닙니다.')
    const input = parseComment(values); thread = input.thread
    // On Vercel, use its overwritten client-IP header, never user X-Forwarded-For.
    const ip = process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() : clientAddress
    if (!ip) throw new CommentError(503, '댓글 서비스를 사용할 수 없습니다.')
    const result = await mutateComment(input, ip)
    if (json) return Response.json(result, { status: input.action === 'create' ? 201 : 200, headers: headers(request) })
    return new Response(null, { status: 303, headers: { ...headers(request), Location: `/comments/?thread=${encodeURIComponent(thread)}&done=1` } })
  } catch (error) {
    if (json) return failure(error, request)
    const message = error instanceof CommentError ? error.message : '댓글 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.'
    return new Response(null, { status: 303, headers: { ...headers(request), Location: `/comments/?thread=${encodeURIComponent(thread)}&error=${encodeURIComponent(message)}` } })
  }
}
