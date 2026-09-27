import { Select, Text, Stack } from '@sanity/ui'
import { set, unset, useFormValue, type StringInputProps } from 'sanity'
import type { BodyBlock } from '../../lib/publishing/types'

export function CrossReferenceInput(props: StringInputProps) {
  const body = (useFormValue(['body']) || []) as BodyBlock[]
  const targets: { key: string; title: string }[] = []
  let figures = 0, equations = 0
  for (const block of body.flatMap(block => block._type === 'figureGallery' ? block.figures || [] : [block])) {
    if (block._type === 'figure' && block.numbered !== false) targets.push({ key: block._key, title: `Figure ${++figures} — ${block.label || block.caption || block.alt || 'Untitled figure'}` })
    if (block._type === 'equation' && block.numbered !== false) targets.push({ key: block._key, title: `Eq. (${++equations}) — ${block.label || block.latex}` })
  }
  return <Stack gap={3}><Select value={props.value || ''} onChange={event => props.onChange(event.currentTarget.value ? set(event.currentTarget.value) : unset())} aria-label="Figure or equation" disabled={props.readOnly}>
    <option value="">Choose a numbered figure or equation</option>{targets.map(target => <option key={target.key} value={target.key}>{target.title}</option>)}
  </Select><Text size={1} muted>Numbering updates automatically when blocks move. The reference follows the selected block.</Text></Stack>
}
