import { useCallback, useEffect, useState } from 'react'
import { Box, Button, Flex, Text } from '@sanity/ui'
import { useClient, useCurrentUser } from 'sanity'
import { createPreviewSecret } from '@sanity/preview-url-secret/create-secret'
import { apiVersion } from '../../lib/publishing/types'

export function ArticlePreview({ document }: { document: { displayed: { _id?: string; _rev?: string } } }) {
  const client = useClient({ apiVersion }), user = useCurrentUser()
  const [url, setUrl] = useState(''), [error, setError] = useState(''), [width, setWidth] = useState('100%')
  const id = document.displayed._id?.replace(/^drafts\./, '')
  const load = useCallback(async () => {
    if (!id) return
    setError('')
    try {
      const { secret } = await createPreviewSecret(client, 'dhsh-studio', window.location.origin, user?.id)
      const preview = new URL('/api/preview/', process.env.SANITY_STUDIO_PREVIEW_ORIGIN || (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:4322' : window.location.origin))
      preview.searchParams.set('sanity-preview-secret', secret)
      preview.searchParams.set('sanity-preview-pathname', `/preview/${id}/`)
      setUrl(preview.href)
    } catch { setError('Preview could not connect. Return to Write to check the save status, then try refreshing.') }
  }, [client, id, user?.id])
  useEffect(() => { void load() }, [load])
  return <Flex direction="column" style={{ height: '100%', background: '#e7e7df' }}>
    <Flex padding={3} gap={2} align="center" wrap="wrap">
      <Button text="Refresh preview" onClick={() => void load()} />
      <Button text="Desktop" mode="ghost" onClick={() => setWidth('100%')} />
      <Button text="Mobile" mode="ghost" onClick={() => setWidth('390px')} />
      <Text size={1} muted>Private preview · Refresh to load saved changes</Text>
    </Flex>
    {error && <Box padding={3}><Text>{error}</Text></Box>}
    {url && <iframe title="Private dhsh.in article preview" src={url} style={{ width, maxWidth: '100%', margin: '0 auto', flex: 1, minHeight: 600, border: 0 }} referrerPolicy="no-referrer" />}
  </Flex>
}
