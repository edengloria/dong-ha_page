"use client"

import Image from "@/components/content/image"
import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from "react"
import { assetPath, layoutFields, parseLayout, sceneAnchors, sceneLinks, SCENE_EVENT, SCENE_STORAGE, type SceneAnchor, type LayoutField, type Placement, type SceneAsset, type SceneItem, type SceneLayout } from "@/lib/scene-layout"
import { attachPlacement, movePlacement, resolvePlacement } from "@/lib/scene-anchors"
import { withBasePath } from "@/lib/paths"
import { MAX_LAYOUT_BYTES } from "@/lib/scene-content"
import { AppearanceProperties, ContentProperties, fitText, uploadedImage } from "./editor-content"

import { useScene, defaults } from "./scene-context"
import { useSceneAnchors } from "./use-scene-anchors"
import { LayoutNumberInput } from "./layout-number-input"
type Drag = { x: number; y: number; scroll: number; before: SceneLayout; ids: string[]; id: string; resize: boolean; changed: boolean; mode: "desktop" | "mobile"; geometry: ReturnType<typeof useSceneAnchors> }
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const mobileSnapshot = () => matchMedia("(max-width: 560px)").matches
const serverMobileSnapshot = () => false
function subscribeMobile(update: () => void) {
  const media = matchMedia("(max-width: 560px)")
  media.addEventListener("change", update)
  return () => media.removeEventListener("change", update)
}

export default function SceneEditor() {
  const { layout, setLayout: onChange } = useScene()
  const geometry = useSceneAnchors("editor", layout)
  const [insertAnchor, setInsertAnchor] = useState<SceneAnchor>("sky")
  const [catalog, setCatalog] = useState<SceneAsset[]>([])
  const [catalogStatus, setCatalogStatus] = useState("에셋을 불러오는 중…")
  const [group, setGroup] = useState("all"), [query, setQuery] = useState("")
  const [page, setPage] = useState(0), [animated, setAnimated] = useState(false)
  const [selected, setSelected] = useState<string | null>("sun-birds")
  const [selection, setSelection] = useState<string[]>(["sun-birds"])
  const [grid, setGrid] = useState(0)
  const mobile = useSyncExternalStore(subscribeMobile, mobileSnapshot, serverMobileSnapshot)
  const [preview, setPreview] = useState(false), [open, setOpen] = useState(true)
  const [dockLeft, setDockLeft] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [past, setPast] = useState<SceneLayout[]>([]), [future, setFuture] = useState<SceneLayout[]>([])
  const drag = useRef<Drag | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const imageInput = useRef<HTMLInputElement>(null)
  const replaceImageId = useRef<string | null>(null)
  const mode = mobile ? "mobile" : "desktop"
  const current = useRef(layout)
  current.current = layout
  const item = layout.items.find((entry) => entry.id === selected)
  const chosen = layout.items.filter((entry) => selection.includes(entry.id))
  function select(ids: string[]) { setSelection(ids); setSelected(ids.at(-1) || null) }
  function jump(id: string) {
    const target = document.getElementById(id)
    if (target instanceof HTMLDetailsElement) target.open = true
    target?.scrollIntoView({ block: "start" })
  }
  function chooseImage(id: string | null = null) { replaceImageId.current = id; imageInput.current?.click() }
  useEffect(() => {
    const abort = new AbortController()
    fetch(withBasePath("/asset/camerons-world/archive/catalog.json"), { signal: abort.signal })
      .then((response) => { if (!response.ok) throw new Error(); return response.json() })
      .then((data) => { setCatalog(data.assets); setCatalogStatus("") })
      .catch(() => { if (!abort.signal.aborted) setCatalogStatus("에셋을 불러오지 못했습니다. 페이지를 새로고침해 주세요.") })
    return () => abort.abort()
  }, [])
  function commit(next: SceneLayout) {
    if (JSON.stringify(next) === JSON.stringify(current.current)) return
    try { parseLayout(next) } catch (error) { setMessage(error instanceof Error ? error.message : "변경을 적용하지 못했습니다."); return }
    const before = current.current
    current.current = next
    setPast((history) => [...history.slice(-49), before]); setFuture([]); onChange(next); setMessage("저장하지 않은 변경")
  }
  function patch(change: Partial<SceneItem>) {
    if (item) commit({ ...layout, items: layout.items.map((entry) => entry.id === item.id ? { ...entry, ...change } : entry) })
  }
  function place(change: Partial<Placement>) { if (item) patch({ [mode]: { ...item[mode], ...change } }) }
  function start(event: PointerEvent<HTMLButtonElement>, entry: SceneItem, resize = false) {
    if (event.button !== 0) return
    event.preventDefault()
    if ((event.shiftKey || event.ctrlKey || event.metaKey) && !resize) {
      select(selection.includes(entry.id) ? selection.filter((id) => id !== entry.id) : [...selection, entry.id]); return
    }
    const ids = selection.includes(entry.id) && !resize ? selection : [entry.id]
    select(ids)
    if (entry.locked) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, y: event.clientY, scroll: scrollY, before: layout, ids, id: entry.id, resize, changed: false, mode, geometry }
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const state = drag.current
    if (!state) return
    const { boxes, viewport } = state.geometry, dragMode = state.mode
    let dx = event.clientX - state.x, dy = event.clientY - state.y + scrollY - state.scroll
    const origin = state.before.items.find((entry) => entry.id === state.id)!
    const rect = resolvePlacement(origin[dragMode], boxes, viewport, origin)
    if (grid && !event.altKey) {
      dx = Math.round((rect.left + dx) / grid) * grid - rect.left
      dy = Math.round((rect.top + dy) / grid) * grid - rect.top
    }
    state.changed = state.changed || Math.abs(dx) > .1 || Math.abs(dy) > .1
    onChange({ ...state.before, items: state.before.items.map((entry) => {
      if (!state.ids.includes(entry.id) || entry.locked) return entry
      const p = entry[dragMode]
      if (!state.resize) return { ...entry, [dragMode]: movePlacement(p, dx, dy, boxes, viewport) }
      // Resize about the centre; a top-edge attachment keeps its bottom on the panel.
      const angle = p.rotation * Math.PI / 180
      let width = (rect.width + 2 * (dx * Math.cos(angle) + dy * Math.sin(angle))) / Math.max(.01, rect.scale)
      if (grid && !event.altKey) width = Math.round(width / grid) * grid
      return { ...entry, [dragMode]: { ...p, size: "responsive", width: clamp(width, 8, 2400) } }
    }) })
  }
  function end(cancel = false) {
    if (drag.current) {
      const before = drag.current.before
      if (cancel) onChange(before)
      else if (drag.current.changed) { setPast((history) => [...history.slice(-49), before]); setFuture([]); setMessage("저장하지 않은 변경") }
    }
    drag.current = null
  }
  function insert(entry: SceneItem) {
    if (current.current.items.length >= 200) { setMessage("배치는 최대 200개까지 지원합니다."); return }
    const next = { ...current.current, items: [...current.current.items, entry] }
    try { parseLayout(next) } catch (error) { setMessage((error as Error).message); return }
    commit(next); select([entry.id]); setPreview(false)
    requestAnimationFrame(() => jump("scene-selection"))
  }
  function newPlacement(width: number): Placement { return { anchor: insertAnchor, coordinateSpace: "group", x: 50, y: 50, width: clamp(width, 8, 320), rotation: 0 } }
  function add(asset: SceneAsset) {
    if (layout.items.length >= 200) { setMessage("배치는 최대 200개까지 지원합니다."); return }
    const placement = newPlacement(asset.width)
    const entry: SceneItem = { id: crypto.randomUUID(), name: asset.file, file: asset.file, still: asset.still,
      width: asset.width, height: asset.height, foreground: false, desktop: placement,
      mobile: { ...placement, width: Math.min(placement.width, 240) } }
    insert(entry)
  }
  function addText() {
    const placement = newPlacement(280)
    insert(fitText({ id: crypto.randomUUID(), name: "새 글자", file: "", still: "", width: 280, height: 60,
      foreground: true, desktop: placement, mobile: { ...placement, width: 240 },
      custom: { kind: "text", text: "Your text here", font: "times", fontSize: 24, color: "#000000", background: "transparent", align: "left", bold: false } }))
  }
  function duplicate() {
    const copies = chosen.map((entry) => ({ ...entry, id: crypto.randomUUID(), name: `${entry.name.slice(0, 113)} (copy)`, locked: false,
      [mode]: movePlacement(entry[mode], 16, 16, geometry.boxes, geometry.viewport) }))
    const next = { ...layout, items: [...layout.items, ...copies] }
    try { parseLayout(next) } catch (error) { setMessage((error as Error).message); return }
    commit(next); select(copies.map((entry) => entry.id))
  }
  function batch(change: (entry: SceneItem) => SceneItem, includeLocked = false) {
    commit({ ...layout, items: layout.items.map((entry) => selection.includes(entry.id) && (includeLocked || !entry.locked) ? change(entry) : entry) })
  }
  function remove() { commit({ ...layout, items: layout.items.filter((entry) => !selection.includes(entry.id) || entry.locked) }); select(chosen.filter((entry) => entry.locked).map((entry) => entry.id)) }
  function undo() {
    if (!past.length) return
    const last = past.at(-1)!; setPast(past.slice(0, -1)); setFuture([...future, layout]); onChange(last); setMessage("저장하지 않은 변경")
  }
  function redo() {
    if (!future.length) return
    const next = future.at(-1)!; setFuture(future.slice(0, -1)); setPast([...past, layout]); onChange(next); setMessage("저장하지 않은 변경")
  }
  function align(axis: "left" | "center" | "right" | "top" | "bottom") {
    if (!item) return
    const target = resolvePlacement(item[mode], geometry.boxes, geometry.viewport, item)
    batch((entry) => {
      const rect = resolvePlacement(entry[mode], geometry.boxes, geometry.viewport, entry)
      const dx = axis === "center" ? target.left - rect.left : axis === "left" ? target.left - target.width / 2 - rect.left + rect.width / 2 : axis === "right" ? target.left + target.width / 2 - rect.left - rect.width / 2 : 0
      const dy = axis === "top" ? target.top - rect.top : axis === "bottom" ? target.top + target.height - rect.top - rect.height : 0
      return { ...entry, [mode]: movePlacement(entry[mode], dx, dy, geometry.boxes, geometry.viewport) }
    })
  }
  function save() {
    try { localStorage.setItem(SCENE_STORAGE, JSON.stringify(layout)); dispatchEvent(new Event(SCENE_EVENT)); setMessage("이 브라우저에 저장했습니다. 홈에서도 같은 배치로 보입니다.") }
    catch { setMessage("브라우저 저장 공간을 사용할 수 없습니다. 배치 파일을 내보내 주세요.") }
  }
  function exportLayout() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(layout, null, 2) + "\n"], { type: "application/json" }))
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "scene-layout.json"; anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  function reorder(direction: number) {
    const items = [...layout.items]
    const order = direction > 0 ? [...items.keys()].reverse() : [...items.keys()]
    for (const index of order) {
      const target = index + direction
      if (target < 0 || target >= items.length || !selection.includes(items[index].id) || items[index].locked || selection.includes(items[target].id) || items[target].locked) continue
      ;[items[index], items[target]] = [items[target], items[index]]
    }
    commit({ ...layout, items })
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const input = event.target instanceof Element && !!event.target.closest("input,textarea,select,[contenteditable=true]")
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault(); if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        requestAnimationFrame(() => document.querySelector<HTMLButtonElement>("[data-scene-save]")?.click()); return
      }
      if (input) return
      if (event.key === "Escape") { if (drag.current) end(true); else select([]); return }
      if (drag.current) return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo() }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") { event.preventDefault(); duplicate() }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") { event.preventDefault(); select(layout.items.filter((entry) => !entry[mode].hidden && !entry.locked).map((entry) => entry.id)) }
      if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); remove() }
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  })
  useEffect(() => { if (drag.current && drag.current.mode !== mode) end(true) })
  const filtered = catalog.filter((asset) => (group === "all" || asset.group === group) &&
    (!animated || asset.frames > 1) && asset.file.toLowerCase().includes(query.toLowerCase()))
  const groups = [...new Set(catalog.map((asset) => asset.group))].sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
  return <>
    {!preview && <div className={`scene-handles${grid ? " scene-grid-visible" : ""}`} style={grid ? { backgroundSize: `${grid}px ${grid}px` } : undefined} aria-label="배치 캔버스">
      {layout.items.filter((entry) => !entry[mode].hidden).map((entry, index) => {
        const p = entry[mode]
        const rendered = resolvePlacement(p, geometry.boxes, geometry.viewport, entry)
        return <div key={entry.id} className="scene-handle-frame" style={{ left: rendered.left, top: rendered.top, width: rendered.width, height: rendered.height, transform: `translateX(-50%) rotate(${p.rotation}deg)`, zIndex: selection.includes(entry.id) ? 201 + index : index }}>
          <button className={`scene-handle ${selection.includes(entry.id) ? "is-selected" : ""}${entry.locked ? " is-locked" : ""}`}
          aria-label={`이동: ${entry.name}`} aria-pressed={selection.includes(entry.id)}
          onPointerDown={(event) => start(event, entry)} onPointerMove={move} onPointerUp={() => end()} onPointerCancel={() => end(true)}
          onFocus={() => { if (!selection.includes(entry.id)) select([entry.id]) }} onKeyDown={(event) => {
            if (!event.key.startsWith("Arrow")) return
            event.preventDefault()
            const step = event.shiftKey ? 10 : 1
            batch((target) => ({ ...target, [mode]: movePlacement(target[mode], event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0,
              event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0, geometry.boxes, geometry.viewport) }))
          }} />
          {selection.includes(entry.id) && !entry.locked && <button className="scene-resize" aria-label={`크기 조절: ${entry.name}`} title="가운데 기준 크기 조절" onPointerDown={(event) => start(event, entry, true)} onPointerMove={move} onPointerUp={() => end()} onPointerCancel={() => end(true)} />}
        </div>
      })}
    </div>}
    <div className="scene-toolbar" role="toolbar" aria-label="배치 편집">
      <strong>배치 편집 · {mobile ? "모바일" : "데스크톱"}</strong>
      <button onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "패널 접기" : "에셋 / 속성"}</button>
      <button onClick={() => setDockLeft(!dockLeft)}>패널 {dockLeft ? "오른쪽으로" : "왼쪽으로"}</button>
      <button onClick={() => setPreview(!preview)} aria-pressed={preview}>{preview ? "편집으로" : "미리보기"}</button>
      <button data-scene-save onClick={save}>브라우저에 저장</button>
      <a href={withBasePath("/")}>홈으로 ↗</a>
    </div>
    {open && <aside className={`scene-panel${dockLeft ? " scene-panel-left" : ""}`} aria-label="에셋과 배치 속성">
      <nav className="scene-panel-nav" aria-label="편집기 구역">{[["scene-layers", "레이어"], ["scene-selection", "선택"], ["scene-background", "배경"], ["scene-catalog", "에셋"]].map(([id, label]) => <button key={id} onClick={() => jump(id)}>{label}</button>)}</nav>
      <h1>Scene editor</h1>
      <p className="scene-help">Shift+클릭으로 여러 개 선택 · 방향키 1px / Shift 10px · 오른쪽 아래 점으로 크기 조절. Ctrl/⌘+Z 되돌리기, Shift+Z 다시 실행, D 복제, S 저장. Esc는 드래그 취소. 560px 이하에서는 모바일 배치를 별도로 편집합니다.</p>
      <div className="scene-actions">
        <button disabled={!past.length} onClick={undo}>되돌리기</button>
        <button disabled={!future.length} onClick={redo}>다시 실행</button>
        <button onClick={() => commit(defaults)}>기본 배치</button>
      </div>
      <p role="status" className="scene-status">{message}</p>
      <label>격자 맞춤<select aria-label="격자 맞춤" value={grid} onChange={(event) => setGrid(Number(event.target.value))}><option value={0}>끔</option>{[4,8,16,32].map((n) => <option key={n} value={n}>{n}px</option>)}</select></label>
      {grid > 0 && <p className="scene-help">화면의 격자에 맞춥니다. Alt를 누르면 잠시 해제됩니다.</p>}
      <label>새 에셋을 붙일 영역<select aria-label="새 에셋을 붙일 영역" value={insertAnchor} onChange={(event) => setInsertAnchor(event.target.value as SceneAnchor)}>{Object.entries(sceneAnchors).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <div className="scene-actions"><button disabled={uploading} onClick={() => chooseImage()}>내 이미지 추가</button><button onClick={addText}>글자 / 링크 추가</button></div>
      <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" aria-label="내 이미지 파일" hidden onChange={async (event) => {
        const file = event.target.files?.[0]; event.target.value = ""
        if (!file) return
        const replace = replaceImageId.current
        setUploading(true)
        try {
          const uploaded = await uploadedImage(file), placement = newPlacement(uploaded.width)
          if (replace) commit({ ...current.current, items: current.current.items.map((entry) => entry.id === replace && !entry.locked ? { ...entry, ...uploaded, file: "", still: "" } : entry) })
          else insert({ id: crypto.randomUUID(), file: "", still: "", foreground: true, ...uploaded, desktop: placement, mobile: { ...placement, width: Math.min(240, placement.width) } })
        } catch (error) { setMessage(error instanceof Error ? error.message : "이미지를 추가하지 못했습니다.") }
        finally { setUploading(false) }
      }} />
      <p className="scene-help">이미지 1장 2MB · 전체 배치 4MB. 직접 올린 이미지도 배치 파일에 포함됩니다.</p>
      <details id="scene-layers" className="scene-save" open><summary>레이어 ({layout.items.length}) · {chosen.length}개 선택</summary>
        <p className="scene-help">위에 있는 항목이 같은 영역의 앞쪽입니다. Shift+클릭으로 다중 선택. 잠근 항목은 이동·삭제되지 않습니다.</p>
        <div className="scene-layer-list">{[...layout.items].reverse().map((entry) => <div key={entry.id} className={selection.includes(entry.id) ? "is-selected" : ""}>
          <button aria-pressed={selection.includes(entry.id)} title={entry.name} onClick={(event) => select(event.shiftKey || event.ctrlKey || event.metaKey ? selection.includes(entry.id) ? selection.filter((id) => id !== entry.id) : [...selection, entry.id] : [entry.id])}>{entry.custom?.kind === "text" ? "T " : ""}{entry.name}</button>
          <button aria-label={`표시: ${entry.name}`} aria-pressed={!entry[mode].hidden} disabled={!!entry.locked} onClick={() => commit({ ...layout, items: layout.items.map((target) => target.id === entry.id ? { ...target, [mode]: { ...target[mode], hidden: !target[mode].hidden } } : target) })}>{entry[mode].hidden ? "숨김" : "표시"}</button>
          <button aria-label={`잠금: ${entry.name}`} aria-pressed={!!entry.locked} onClick={() => commit({ ...layout, items: layout.items.map((target) => target.id === entry.id ? { ...target, locked: !target.locked } : target) })}>{entry.locked ? "잠김" : "잠금"}</button>
        </div>)}</div>
        <div className="scene-actions"><button disabled={!chosen.length} onClick={duplicate}>복제</button><button disabled={!chosen.some((entry) => !entry.locked)} onClick={remove}>선택 삭제</button><button disabled={!chosen.length} onClick={() => batch((entry) => ({ ...entry, locked: !chosen.every((target) => target.locked) }), true)}>선택 잠금 / 해제</button></div>
        <div className="scene-actions"><button onClick={() => reorder(-1)} disabled={!chosen.length}>선택 뒤로</button><button onClick={() => reorder(1)} disabled={!chosen.length}>선택 앞으로</button><button disabled={!chosen.length} onClick={() => batch((entry) => ({ ...entry, [mode]: { ...entry[mode], hidden: !chosen.every((target) => target[mode].hidden) } }))}>선택 표시 / 숨김</button></div>
        {chosen.length > 1 && <><p>마지막 선택 항목의 회전 전 상자를 기준으로 정렬합니다.</p><div className="scene-actions">{(["left", "center", "right", "top", "bottom"] as const).map((axis, i) => <button key={axis} onClick={() => align(axis)}>{["왼쪽 맞춤", "가운데 맞춤", "오른쪽 맞춤", "위 맞춤", "아래 맞춤"][i]}</button>)}</div></>}
      </details>
      <AppearanceProperties layout={layout} commit={commit} />
      <details id="scene-background" className="scene-save" open><summary>배경 / 패널 레이아웃</summary>
        <p>현재 화면 크기의 설정입니다. 너비는 화면에 맞춰 줄어들며, 높이는 내용이 잘리지 않도록 최소 높이로 적용됩니다. 왼쪽 패널 너비는 두 열 화면(900px 초과)에 적용됩니다.</p>
        {["배경", "패널"].map((section) => <fieldset key={section} className="scene-properties"><legend>{section}</legend>
          <div className="scene-fields">{(Object.entries(layoutFields) as [LayoutField, (typeof layoutFields)[LayoutField]][]).filter(([, field]) => field.group === section).map(([key, field]) => {
            const value = layout.settings?.[mode]?.[key] ?? field[mode]
            return <label key={key}>{field.label} ({field.unit})<LayoutNumberInput value={value} mode={mode} min={field.min} max={field.max}
              onCommit={bounded => {
                const activeMode = mobileSnapshot() ? "mobile" : "desktop", latest = current.current
                if (bounded !== (latest.settings?.[activeMode]?.[key] ?? field[activeMode])) {
                  commit({ ...latest, settings: { ...latest.settings, [activeMode]: { ...latest.settings?.[activeMode], [key]: bounded } } })
                }
              }} /></label>
          })}</div>
        </fieldset>)}
        <button onClick={() => commit({ ...layout, settings: { ...layout.settings, [mode]: {} } })}>이 화면의 배경 / 패널 초기화</button>
      </details>
      <label id="scene-selection">배치한 에셋 ({layout.items.length})<select value={item?.id || ""} onChange={(event) => select(event.target.value ? [event.target.value] : [])}><option value="">선택</option>{layout.items.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
      {item && <button onClick={() => { const rect = resolvePlacement(item[mode], geometry.boxes, geometry.viewport, item); scrollTo({ top: Math.max(0, rect.top - 160), behavior: "instant" }) }}>선택으로 이동</button>}
      {item?.locked && <p>잠긴 항목입니다. 레이어 목록에서 잠금을 해제하세요.</p>}
      {item && <fieldset className="scene-properties" disabled={!!item.locked}><legend>{item.name}</legend>
        <ContentProperties item={item} patch={patch} message={setMessage} />
        {item.custom?.kind !== "text" && <button disabled={uploading} onClick={() => chooseImage(item.id)}>이미지 바꾸기</button>}
        <label>붙일 영역<select aria-label="붙일 영역" value={item[mode].anchor || ""} onChange={(event) => place(attachPlacement(item[mode], (event.target.value || undefined) as SceneAnchor | undefined, geometry.boxes, geometry.viewport, item, item[mode].edge))}>
          <option value="">화면 전체 (기존 좌표)</option>{Object.entries(sceneAnchors).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select></label>
        {item[mode].anchor && <>
          <label><input type="checkbox" checked={item[mode].coordinateSpace === "group"} onChange={(event) => place(attachPlacement(item[mode], item[mode].anchor, geometry.boxes, geometry.viewport, item, item[mode].edge, event.target.checked))} /> 묶음 기준 배치</label>
          <label><input type="checkbox" checked={item[mode].edge === "top"} onChange={(event) => place(attachPlacement(item[mode], item[mode].anchor, geometry.boxes, geometry.viewport, item, event.target.checked ? "top" : undefined, item[mode].coordinateSpace === "group"))} /> 윗변에 붙이기</label>
          <p className="scene-help">{item[mode].coordinateSpace === "group" ? "좌표는 FHD 배치 묶음 기준입니다. 영역 중앙과 윗변을 따라가며 본문 높이가 바뀌어도 간격이 유지됩니다. 노을·바다는 픽셀 크기를 유지하고, 패널 묶음은 공간이 좁을 때 함께 줄어듭니다." : "위치는 선택한 영역의 가로·세로 %입니다."} {item[mode].edge === "top" && "이미지 아래쪽을 영역 윗변에 맞춥니다. 간격 0은 윗변에 닿고, 양수는 패널 안쪽, 음수는 위쪽입니다."} 왼쪽 패널의 앞쪽 장식은 다른 페이지에서도 유지됩니다.</p>
        </>}
        <div className="scene-fields">{([
          ["x", "가로 위치 (%)", item[mode].anchor ? -1000 : -50, item[mode].anchor ? 1000 : 150, .1], ["y", item[mode].edge === "top" ? "윗변과 아래쪽 간격 (px)" : item[mode].anchor ? "세로 위치 (%)" : "세로 위치 (px)", item[mode].anchor ? -50000 : 0, 50000, item[mode].anchor ? .1 : 1],
          ["width", "너비 (px)", 8, 2400, 1], ["rotation", "회전 (°)", -180, 180, 1],
        ] as const).map(([key, label, min, max, step]) => <label key={key}>{label}<input key={`${item.id}-${mode}-${item[mode][key]}`} type="number" min={min} max={max} step={step} defaultValue={Math.round(item[mode][key] * 10) / 10}
          onBlur={(event) => {
            const value = event.target.valueAsNumber
            if (Number.isFinite(value)) place({ [key]: clamp(value, min, max) })
            else event.target.value = String(item[mode][key])
          }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur() }} /></label>)}</div>
        <label>이미지 링크<select aria-label="이미지 링크" value={item.link || ""} onChange={(event) => patch({ link: (event.target.value || undefined) as SceneItem["link"] })}><option value="">장식만</option>{Object.entries(sceneLinks).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>크기 방식<select aria-label="크기 방식" value={item[mode].size || "responsive"} onChange={(event) => place({ size: event.target.value as Placement["size"] })}><option value="responsive">영역에 맞춤</option><option value="original">원본 크기</option><option value="integer">정수 배율</option></select></label>
        {item[mode].size === "integer" && <label>정수 배율<select aria-label="정수 배율" value={item[mode].pixelScale || 1} onChange={(event) => place({ pixelScale: Number(event.target.value) })}>{[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n}×</option>)}</select></label>}
        <label><input type="checkbox" checked={!!item.pixelated} onChange={(event) => patch({ pixelated: event.target.checked })} /> 픽셀 가장자리 선명하게</label>
        <label><input type="checkbox" checked={!!item.flipX} onChange={(event) => patch({ flipX: event.target.checked })} /> 좌우 뒤집기</label>
        <label><input type="checkbox" checked={!!item.flipY} onChange={(event) => patch({ flipY: event.target.checked })} /> 위아래 뒤집기</label>
        <label>불투명도 (%)<input key={item.id + String(item.opacity)} type="number" min={0} max={100} defaultValue={Math.round((item.opacity ?? 1) * 100)} onBlur={(event) => { if (Number.isFinite(event.target.valueAsNumber)) patch({ opacity: clamp(event.target.valueAsNumber, 0, 100) / 100 }) }} /></label>
        <label><input type="checkbox" checked={item.foreground} onChange={(event) => patch({ foreground: event.target.checked })} /> 본문 위에 배치</label>
        <label><input type="checkbox" checked={!!item[mode].hidden} onChange={(event) => place({ hidden: event.target.checked })} /> 이 화면 크기에서 숨기기</label>
        <button onClick={() => place({ ...item[mode === "desktop" ? "mobile" : "desktop"] })}>{mode === "desktop" ? "모바일" : "데스크톱"} 배치를 현재 화면에 복사</button>
        <div className="scene-actions"><button onClick={() => reorder(-1)}>뒤로</button><button onClick={() => reorder(1)}>앞으로</button>
          <button onClick={remove}>삭제</button>
          {item.custom?.kind !== "text" && <a href={item.custom?.kind === "image" ? item.custom.src : withBasePath(assetPath(item.file))} download={item.name}>원본 저장</a>}</div>
      </fieldset>}
      <details className="scene-save"><summary>배치 파일 / 공개 사이트 반영</summary>
        <p>브라우저 저장은 이 기기의 미리보기에 적용됩니다. 모든 방문자에게 반영하려면 배치 파일을 내보내고 GitHub의 data 폴더에 같은 이름으로 업로드·커밋하세요. 기존 배포가 자동 실행됩니다.</p>
        <div className="scene-actions"><button onClick={exportLayout}>배치 내보내기</button><button onClick={() => fileInput.current?.click()}>배치 불러오기</button>
          <a href="https://github.com/edengloria/dong-ha_page/upload/main/data" target="_blank" rel="noopener noreferrer">GitHub에 반영 ↗</a></div>
        <button onClick={() => { try { localStorage.removeItem(SCENE_STORAGE); commit(defaults); setMessage("브라우저 저장을 지웠습니다. 공개 배치를 표시합니다.") } catch { setMessage("브라우저 저장 공간에 접근할 수 없습니다.") } }}>브라우저 저장 지우기</button>
        <input ref={fileInput} type="file" accept=".json,application/json" hidden aria-label="배치 파일" onChange={async (event) => {
          const file = event.target.files?.[0]; event.target.value = ""
          if (!file) return
          try {
            if (file.size > MAX_LAYOUT_BYTES) throw new Error("이미지를 포함한 배치 파일은 4MB까지 지원합니다.")
            const next = parseLayout(JSON.parse(await file.text()))
            const known = new Set(catalog.map((asset) => asset.file))
            const stills = new Set(catalog.map((asset) => asset.still))
            if (next.items.some((entry) => !entry.custom && (!known.has(entry.file) || !stills.has(entry.still)))) throw new Error("보관함에 없는 에셋입니다. 에셋 로딩 후 다시 시도해 주세요.")
            commit(next); select(next.items[0] ? [next.items[0].id] : [])
          } catch (error) { setMessage(error instanceof Error ? error.message : "파일을 읽지 못했습니다.") }
        }} />
      </details>
      <h2 id="scene-catalog">에셋 보관함 ({catalog.length.toLocaleString()})</h2>
      <a href={withBasePath("/asset/camerons-world/archive.zip")} download>전체 에셋 ZIP 저장</a>
      <label>파일 검색<input type="search" value={query} placeholder="예: 10/6, bg, cat" onChange={(event) => { setQuery(event.target.value); setPage(0) }} /></label>
      <label>원본 구역<select value={group} onChange={(event) => { setGroup(event.target.value); setPage(0) }}><option value="all">전체</option>{groups.map((value) => <option key={value} value={value}>{value === "10" ? "10 · 노을" : value === "11" ? "11 · 바다" : value === "12" ? "12 · 물결" : value}</option>)}</select></label>
      <label><input type="checkbox" checked={animated} onChange={(event) => { setAnimated(event.target.checked); setPage(0) }} /> 움직이는 에셋만</label>
      {catalogStatus && <p role="status">{catalogStatus}</p>}
      <div className="asset-grid">{filtered.slice(page * 36, page * 36 + 36).map((asset) => <button key={asset.id} onClick={() => add(asset)} title={`추가: ${asset.file} (${asset.width}×${asset.height})`} aria-label={`추가: ${asset.file}`}>
        <Image src={withBasePath(assetPath(asset.thumbnail))} alt="" width={160} height={120} loading="lazy" />
        <span>{asset.file.replace("img/content/", "")}</span>{asset.frames > 1 && <small>GIF</small>}
      </button>)}</div>
      <div className="scene-actions"><button disabled={page === 0} onClick={() => setPage(page - 1)}>이전</button><span>{filtered.length ? page + 1 : 0} / {Math.ceil(filtered.length / 36)}</span><button disabled={(page + 1) * 36 >= filtered.length} onClick={() => setPage(page + 1)}>다음</button></div>
    </aside>}
  </>
}
