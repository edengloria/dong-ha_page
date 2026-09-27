import { useEffect, useRef, useState } from "react"

// Keep a focused draft intact when the viewport changes before the media-query
// notification arrives. Commit against the current viewport in the parent.
export function LayoutNumberInput({ value, mode, min, max, onCommit }: {
  value: number; mode: string; min: number; max: number; onCommit: (value: number) => void
}) {
  const [draft, setDraft] = useState(String(value))
  const focused = useRef(false)
  useEffect(() => { if (!focused.current) setDraft(String(value)) }, [value, mode])
  return <input type="number" min={min} max={max} step="1" value={draft}
    onFocus={() => { focused.current = true }}
    onChange={event => setDraft(event.target.value)}
    onBlur={event => {
      focused.current = false
      const number = event.currentTarget.valueAsNumber
      if (!Number.isFinite(number)) { setDraft(String(value)); return }
      const bounded = Math.max(min, Math.min(max, number))
      setDraft(String(bounded)); onCommit(bounded)
    }}
    onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur() }} />
}
