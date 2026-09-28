import { createClient, type SanityClient } from '@sanity/client'
import { apiVersion, dataset, projectId, type Post, type Taxonomy, articleTypes } from './types'

export const postProjection = `{
  ...,
  topics[]->{_id, title, slug, description}, tags[]->{_id, title, slug},
  series->{_id, title, slug, description}, authors[]->{_id, name, url},
  "references": *[_type == "referenceRecord" && (_id in ^.references[]._ref || _id in ^.body[].markDefs[].reference._ref || _id in ^.body[].reference._ref || _id in ^.body[].body[].markDefs[].reference._ref)]
}`
export function contentClient(token?: string, drafts = false): SanityClient {
  if (drafts && !token) throw new Error('Draft access requires a server-side Sanity token')
  return createClient({ projectId, dataset, apiVersion, useCdn: false, perspective: drafts ? 'drafts' : 'published', token })
}
export async function getDraftPost(id: string, token: string): Promise<Post | null> {
  if (!/^[a-zA-Z0-9_.-]{1,150}$/.test(id)) return null
  return contentClient(token, true).fetch(`*[_type == "post" && _id == $id][0]${postProjection}`, { id: id.replace(/^drafts\./, '') })
}

export interface PublishingData { posts: Post[]; topics: Taxonomy[]; tags: Taxonomy[]; series: Taxonomy[]; settings?: { blogTitle?: string; blogDescription?: string } }
export function blogSettings(data: PublishingData) {
  return {
    title: data.settings?.blogTitle?.trim() || 'Blog',
    description: data.settings?.blogDescription?.trim() || 'Research and engineering notes on optics, AI, graphics, programming, and engineering.',
  }
}
let buildSnapshot: Promise<PublishingData> | undefined

/** One published-only snapshot per build; an API error must fail the build. */
export function getPublishingData(): Promise<PublishingData> {
  return buildSnapshot ||= loadPublishingData()
}
async function loadPublishingData(): Promise<PublishingData> {
  if (process.env.DOCUMENT_VISUAL_TEST === '1') {
    const { publishingFixture } = await import('../../tests/fixtures/publishing')
    return publishingFixture
  }
  const data = await contentClient().fetch<PublishingData>(`{
    "posts": *[_type == "post"] | order(publishedAt desc, _id asc) ${postProjection},
    "topics": *[_type == "topic"] | order(title asc) {_id, title, slug, description},
    "tags": *[_type == "tag"] | order(title asc) {_id, title, slug, description},
    "series": *[_type == "series"] | order(title asc) {_id, title, slug, description},
    "settings": *[_type == "siteSettings" && _id == "site-settings"][0]{blogTitle, blogDescription}
  }`)
  const urls = new Set<string>()
  for (const post of data.posts) {
    if (post._id.startsWith('drafts.') || post._id.startsWith('versions.')) throw new Error('A non-public document entered the published snapshot')
    const slug = post.slug?.current
    if (!['ko', 'en'].includes(post.language) || !slug || !/^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u.test(slug)) throw new Error(`Invalid permanent URL for published post ${post._id}`)
    if (!post.title || !post.excerpt || !post.body?.length || !post.publishedAt || Number.isNaN(Date.parse(post.publishedAt)) || !articleTypes.some(type => type.value === post.articleType)) throw new Error(`Incomplete published article ${post._id}`)
    const url = `${post.language}/${slug}`
    if (urls.has(url)) throw new Error(`Duplicate public article URL: ${url}`)
    urls.add(url)
    post.topics = (post.topics || []).filter(Boolean)
    post.tags = (post.tags || []).filter(Boolean)
    post.authors = (post.authors || []).filter(Boolean)
  }
  for (const kind of ['topics', 'tags', 'series'] as const) {
    const names = new Set<string>()
    for (const item of data[kind]) {
      if (!item.title || !item.slug?.current || !/^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u.test(item.slug.current) || names.has(item.slug.current)) throw new Error(`Invalid or duplicate ${kind} URL: ${item._id}`)
      names.add(item.slug.current)
    }
  }
  return data
}

export function seriesParts(post: Post, posts: Post[]) {
  return post.series ? posts.filter(item => item.series?._id === post.series?._id && item.language === post.language)
    .sort((a, b) => (a.seriesOrder ?? Number.MAX_SAFE_INTEGER) - (b.seriesOrder ?? Number.MAX_SAFE_INTEGER) || a._id.localeCompare(b._id)) : []
}
export function relatedPosts(post: Post, posts: Post[]) {
  const topics = new Set(post.topics?.map(item => item._id)), tags = new Set(post.tags?.map(item => item._id))
  return posts.filter(item => item._id !== post._id && item.language === post.language)
    .map(item => ({ item, score: (item.topics || []).filter(topic => topics.has(topic._id)).length + 2 * (item.tags || []).filter(tag => tags.has(tag._id)).length }))
    .filter(item => item.score > 0).sort((a, b) => b.score - a.score || (b.item.publishedAt || '').localeCompare(a.item.publishedAt || '')).slice(0, 3).map(item => item.item)
}
