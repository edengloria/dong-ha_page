import { getPublishingData } from '../../lib/publishing/query'
import { postPath } from '../../lib/publishing/types'
export async function GET() {
  const { posts } = await getPublishingData()
  return Response.json({ buildId: process.env.GITHUB_RUN_ID || 'local', generatedAt: new Date().toISOString(), articles: posts.map(post => ({ id: post._id, revision: post._rev, path: postPath(post), updatedAt: post.updatedAt || post.publishedAt })) })
}
