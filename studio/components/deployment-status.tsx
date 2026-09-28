import { useEffect, useState } from 'react'
import { Card, Stack, Text } from '@sanity/ui'
import { useClient } from 'sanity'
import { apiVersion, postPath, type Post } from '../../lib/publishing/types'

interface Status { message: string; href?: string; error?: boolean }
export function DeploymentStatus({ id }: { id: string }) {
  const client = useClient({ apiVersion })
  const [status, setStatus] = useState<Status>({ message: 'Checking publication status…' })
  useEffect(() => {
    let active = true
    const documentId = id.replace(/^drafts\./, '')
    async function refresh() {
      try {
        const [published, event, response] = await Promise.all([
          client.getDocument<Post>(documentId),
          client.fetch<{ status: string; runUrl?: string; operation: string } | null>('*[_type == "publishingEvent" && documentId == $id] | order(receivedAt desc)[0]{status, runUrl, operation}', { id: documentId }, { perspective: 'raw' }),
          fetch(`https://dhsh.in/publishing-manifest.json?t=${Date.now()}`, { cache: 'no-store' }).catch(() => null),
        ])
        const live = response?.ok ? (await response.json()).articles?.find((item: { id: string }) => item.id === documentId) : undefined
        let next: Status
        if (published && live?.revision === published._rev) next = { message: 'Live on dhsh.in · Published version deployed. Draft edits stay private.', href: `https://dhsh.in${postPath(published)}` }
        else if (!published && response?.ok && !live) next = { message: 'Draft only · Not on the public website.' }
        else if (event?.status === 'failed') next = { message: 'Deployment failed. The previous public version is unchanged. Review the build, then republish to retry.', href: event.runUrl, error: true }
        else if (['queued', 'dispatching', 'building', 'retrying', 'received'].includes(event?.status || '')) next = { message: published ? 'Published in CMS · Deployment in progress. Not live yet.' : 'Unpublished in CMS · Removal from the public website is in progress.', href: event?.runUrl }
        else next = { message: published ? 'Published in CMS · Waiting for a confirmed public deployment.' : live ? 'Draft in CMS · The previous version is still on the public website.' : 'Draft · Public deployment has not been connected yet.' }
        if (active) setStatus(next)
      } catch { if (active) setStatus({ message: 'Deployment status unavailable. Your Studio save status is shown in the editor footer.' }) }
    }
    void refresh()
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void refresh() }, 15_000)
    return () => { active = false; clearInterval(timer) }
  }, [client, id])
  return <Card padding={3} marginBottom={4} border tone={status.error ? 'critical' : 'transparent'}>
    <Stack gap={2}><Text size={1} role="status">{status.message}</Text>{status.href && <Text size={1}><a href={status.href} target="_blank" rel="noreferrer">{status.href.startsWith('https://dhsh.in') ? 'Open live article' : 'View deployment'}</a></Text>}</Stack>
  </Card>
}
