import { postPath, siteUrl, type Post } from './types'
import { imageAsset } from './render'

/** Explicit translation links form a group; no language is invented or translated. */
export function translationsFor(post: Post, posts: Post[]) {
  const group = new Set([post._id])
  let changed = true
  while (changed) {
    changed = false
    for (const item of posts) {
      const target = item.translationOf?._ref
      if (target && posts.some(candidate => candidate._id === target) && (group.has(item._id) || group.has(target))) {
        if (!group.has(item._id) || !group.has(target)) changed = true
        group.add(item._id); group.add(target)
      }
    }
  }
  const linked = posts.filter(item => group.has(item._id))
  if (new Set(linked.map(item => item.language)).size !== linked.length) throw new Error(`Translation group contains duplicate languages: ${post._id}`)
  return linked.length > 1 ? linked : []
}

export function articleStructuredData(post: Post, canonical = new URL(postPath(post), siteUrl).href) {
  const image = imageAsset(post.seo?.socialImage || post.heroImage)
  return {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'Person', '@id': `${siteUrl}/#person`, name: 'Dong-Ha Shin', url: siteUrl },
      { '@type': 'BlogPosting', '@id': `${canonical}#article`, mainEntityOfPage: canonical, url: canonical,
        headline: post.title, description: post.excerpt, inLanguage: post.language,
        datePublished: post.publishedAt, dateModified: post.updatedAt || post.publishedAt,
        author: (post.authors?.length ? post.authors : [{ name: 'Dong-Ha Shin', url: siteUrl }]).map(author => ({ '@type': 'Person', name: author.name, url: author.url })),
        image: image ? [image.url] : undefined,
        articleSection: post.topics?.map(topic => topic.title), keywords: post.tags?.map(tag => tag.title),
        isPartOf: { '@type': 'Blog', '@id': `${siteUrl}/blog/`, name: 'Research & Engineering Notes' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog/` },
        { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
      ] },
    ],
  }
}
export const safeJson = (value: unknown) => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029')
