import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async ({ request, url }, next) => {
  const type = request.headers.get('content-type')?.split(';')[0] || ''
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'].includes(type)
    && url.pathname !== '/api/comments/' && request.headers.get('origin') !== url.origin) {
    return new Response('Cross-origin form request rejected.', { status: 403 })
  }
  return next()
})
