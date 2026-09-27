import { createClient, type SanityClient } from '@sanity/client'
import { apiVersion, dataset, projectId, type Post } from './types'

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
