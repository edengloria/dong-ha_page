import type { APIRoute } from 'astro'
import { validatePreviewUrl } from '@sanity/preview-url-secret'
import { contentClient } from '../../../../lib/publishing/query'
import { cookieName, createSession, readToken } from '../../lib/auth'

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow, noarchive' }
  if (!url.searchParams.get('sanity-preview-secret')) return new Response('Sign in through Sanity Studio to preview drafts.', { status: 401, headers })
  try {
    const result = await validatePreviewUrl(contentClient(readToken(), true), url.href)
    const allowed = new Set(['https://studio.dhsh.in', ...(import.meta.env.DEV ? ['http://localhost:3333', 'http://127.0.0.1:3333'] : [])])
    if (!result.isValid || !result.studioOrigin || !allowed.has(result.studioOrigin) || !/^\/preview\/[a-zA-Z0-9_.-]{1,150}\/$/.test(result.redirectTo || '')) return new Response('Preview access expired or invalid. Open a fresh preview from Studio.', { status: 401, headers })
    cookies.set(cookieName, createSession(), { httpOnly: true, secure: url.protocol === 'https:', sameSite: 'lax', path: '/', maxAge: 1800 })
    const response = redirect(result.redirectTo!, 303)
    Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
    return response
  } catch (error) {
    console.error('Private preview initialization failed:', error instanceof Error ? error.name : 'Unknown error')
    return new Response('Private preview is temporarily unavailable.', { status: 503, headers })
  }
}
