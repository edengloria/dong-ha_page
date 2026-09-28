import { Card, Stack, Text } from '@sanity/ui'
import type { PreviewProps } from 'sanity'

export function CodePreview(props: PreviewProps & { code?: string }) {
  return <Card padding={3} border radius={2}>
    <Stack gap={3}><Text size={1} weight="semibold">{String(props.title || 'Code')} · {String(props.subtitle || 'text')}</Text>
      <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6, maxHeight: 220, overflow: 'hidden', whiteSpace: 'pre-wrap' }}>{props.code || 'Double-click to write code'}</pre>
    </Stack>
  </Card>
}
export function CalloutPreview(props: PreviewProps & { text?: string }) {
  return <Card padding={4} border radius={2} tone={props.subtitle === 'warning' ? 'caution' : 'primary'}>
    <Stack gap={3}><Text weight="semibold">{String(props.title || 'Note')}</Text><Text size={1}>{props.text || 'Double-click to write a callout'}</Text></Stack>
  </Card>
}
