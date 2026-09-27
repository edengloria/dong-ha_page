import { useMemo } from 'react'
import { Card, Stack, Text, TextArea } from '@sanity/ui'
import { set, unset, type TextInputProps, type PreviewProps } from 'sanity'
import katex from 'katex'
import 'katex/dist/katex.min.css'

function render(latex: string, displayMode = true) {
  try { return { html: katex.renderToString(latex, { displayMode, throwOnError: true, trust: false, maxExpand: 1000, maxSize: 20 }) } }
  catch (error) { return { error: error instanceof Error ? error.message : 'Invalid equation' } }
}
export function MathInput(props: TextInputProps) {
  const preview = useMemo(() => render(props.value || ''), [props.value])
  return <Stack gap={3}>
    <TextArea {...props.elementProps} value={props.value || ''} rows={4} style={{ fontFamily: 'monospace' }} onChange={event => props.onChange(event.currentTarget.value ? set(event.currentTarget.value) : unset())} />
    <Card padding={3} tone={preview.error ? 'critical' : 'transparent'} border radius={2}>
      {preview.error ? <Text size={1}>{preview.error}</Text> : <div style={{ overflowX: 'auto' }} aria-label="Equation preview" dangerouslySetInnerHTML={{ __html: preview.html! }} />}
    </Card>
  </Stack>
}
export function MathPreview(props: PreviewProps) {
  const preview = render(String(props.title || ''))
  return <Card padding={3} style={{ overflowX: 'auto' }}>
    {preview.error ? <Text size={1}>{String(props.title || 'Equation')}</Text> : <div dangerouslySetInnerHTML={{ __html: preview.html! }} />}
  </Card>
}
export function InlineMathPreview(props: PreviewProps) {
  const preview = render(String(props.title || ''), false)
  return preview.error
    ? <span>{String(props.title || 'Equation')}</span>
    : <span style={{ paddingInline: 4 }} dangerouslySetInnerHTML={{ __html: preview.html! }} />
}
