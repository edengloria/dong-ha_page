import { getPublishingData, blogSettings } from '../../lib/publishing/query'
import { postPath, siteUrl } from '../../lib/publishing/types'
import { escapeHtml } from '../../lib/publishing/render'
export async function GET() {
  const data = await getPublishingData(), { posts } = data, settings = blogSettings(data)
  const items = posts.filter(post => !post.seo?.noindex).map(post => {
    const url = new URL(postPath(post), siteUrl).href
    return `<item><title>${escapeHtml(post.title)}</title><link>${escapeHtml(url)}</link><guid isPermaLink="true">${escapeHtml(url)}</guid><description>${escapeHtml(post.excerpt)}</description><pubDate>${new Date(post.publishedAt!).toUTCString()}</pubDate></item>`
  }).join('')
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>dhsh.in — ${escapeHtml(settings.title)}</title><link>${siteUrl}/blog/</link><description>${escapeHtml(settings.description)}</description><atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
