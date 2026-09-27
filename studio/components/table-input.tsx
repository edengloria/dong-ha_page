import { Button, Flex, Stack, TextInput, Checkbox, Text } from '@sanity/ui'
import { set, setIfMissing, type ObjectInputProps } from 'sanity'
import type { TableBlock } from '../../lib/publishing/types'

export function TableInput(props: ObjectInputProps) {
  const value = props.value as TableBlock | undefined
  const rows = value?.rows || []
  const columns = Math.max(2, ...rows.map(row => row.cells.length))
  const change = (next: typeof rows) => props.onChange([setIfMissing({ _type: 'table' }), set(next, ['rows'])])
  const newRow = () => ({ _type: 'tableRow', _key: crypto.randomUUID(), cells: Array(columns).fill('') as string[] })
  return <Stack gap={3}>
    <TextInput aria-label="Table caption" placeholder="Table caption" value={props.value?.caption || ''} onChange={event => props.onChange([setIfMissing({ _type: 'table' }), set(event.currentTarget.value, ['caption'])])} />
    <label><Flex gap={2} align="center"><Checkbox checked={props.value?.header !== false} onChange={event => props.onChange([setIfMissing({ _type: 'table' }), set(event.currentTarget.checked, ['header'])])} /><Text size={1}>First row is a header</Text></Flex></label>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderSpacing: 4 }}><tbody>{rows.map((row, r) => <tr key={row._key}>
        {Array.from({ length: columns }, (_, c) => <td key={c} style={{ minWidth: 120 }}>
          <TextInput aria-label={`Row ${r + 1}, column ${c + 1}`} value={row.cells[c] || ''} onChange={event => change(rows.map((item, index) => index === r ? { ...item, cells: Array.from({ length: columns }, (_, col) => col === c ? event.currentTarget.value : item.cells[col] || '') } : item))}
            onPaste={event => {
              const text = event.clipboardData.getData('text/plain')
              if (!text.includes('\t') && !text.includes('\n')) return
              event.preventDefault()
              const pasted = text.trimEnd().split(/\r?\n/).map(line => line.split('\t'))
              const next = rows.map(item => ({ ...item, cells: [...item.cells] }))
              pasted.forEach((cells, offset) => { while (next.length <= r + offset) next.push(newRow()); cells.forEach((value, col) => { next[r + offset].cells[c + col] = value }) })
              change(next)
            }} />
        </td>)}
        <td><Button text="Remove row" tone="critical" mode="bleed" onClick={() => change(rows.filter((_, index) => index !== r))} /></td>
      </tr>)}</tbody></table>
    </div>
    <Flex gap={2}><Button text="Add row" onClick={() => change([...rows, newRow()])} /><Button text="Add column" disabled={!rows.length} onClick={() => change(rows.map(row => ({ ...row, cells: [...row.cells, ''] })))} /><Button text="Remove last column" disabled={columns <= 2} onClick={() => change(rows.map(row => ({ ...row, cells: row.cells.slice(0, -1) })))} /></Flex>
    <Text size={1} muted>Paste cells from Excel or a tab-separated table directly into a cell.</Text>
  </Stack>
}
