"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type PointerEvent } from "react"
import { assetPath, layoutFields, parseLayout, sceneAnchors, SCENE_EVENT, SCENE_STORAGE, type SceneAnchor, type LayoutField, type Placement, type SceneAsset, type SceneItem, type SceneLayout } from "@/lib/scene-layout"
import { attachPlacement, movePlacement, resolvePlacement, type AnchorBoxes } from "@/lib/scene-anchors"
import { withBasePath } from "@/lib/utils"

type Props = { layout: SceneLayout; onChange: (layout: SceneLayout) => void; defaults: SceneLayout; geometry: { boxes: AnchorBoxes; viewport: number } }
type Drag = { x: number; y: number; scroll: number; before: SceneLayout; id: string; placement: Placement }
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export default function SceneEditor({ layout, onChange, defaults, geometry }: Props) {
  const [catalog, setCatalog] = useState<SceneAsset[]>([])
  const [catalogStatus, setCatalogStatus] = useState("에셋을 불러오는 중…")
  const [group, setGroup] = useState("all"), [query, setQuery] = useState("")
  const [page, setPage] = useState(0), [animated, setAnimated] = useState(false)
  const [selected, setSelected] = useState<string | null>("sun-birds")
  const [mobile, setMobile] = useState(false), [preview, setPreview] = useState(false), [open, setOpen] = useState(true)
  const [message, setMessage] = useState("")
  const [past, setPast] = useState<SceneLayout[]>([]), [future, setFuture] = useState<SceneLayout[]>([])
  const drag = useRef<Drag | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const mode = mobile ? "mobile" : "desktop"
  const item = layout.items.find((entry) => entry.id === selected)
  useEffect(() => {
    const media = matchMedia("(max-width: 560px)")
    const update = () => setMobile(media.matches)
    update(); media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  useEffect(() => {
    const abort = new AbortController()
    fetch(withBasePath("/asset/camerons-world/archive/catalog.json"), { signal: abort.signal })
      .then((response) => { if (!response.ok) throw new Error(); return response.json() })
      .then((data) => { setCatalog(data.assets); setCatalogStatus("") })
      .catch(() => { if (!abort.signal.aborted) setCatalogStatus("에셋을 불러오지 못했습니다. 페이지를 새로고침해 주세요.") })
    return () => abort.abort()
  }, [])
  function commit(next: SceneLayout) {
    setPast((history) => [...history.slice(-49), layout]); setFuture([]); onChange(next); setMessage("저장하지 않은 변경")
  }
  function patch(change: Partial<SceneItem>) {
    if (item) commit({ ...layout, items: layout.items.map((entry) => entry.id === item.id ? { ...entry, ...change } : entry) })
  }
  function place(change: Partial<Placement>) { if (item) patch({ [mode]: { ...item[mode], ...change } }) }
  function start(event: PointerEvent<HTMLButtonElement>, entry: SceneItem) {
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setSelected(entry.id)
    drag.current = { x: event.clientX, y: event.clientY, scroll: scrollY, before: layout, id: entry.id, placement: entry[mode] }
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const state = drag.current
    if (!state) return
    const next = movePlacement(state.placement, event.clientX - state.x, event.clientY - state.y + scrollY - state.scroll, geometry.boxes, geometry.viewport)
    onChange({ ...state.before, items: state.before.items.map((entry) => entry.id === state.id ? { ...entry, [mode]: next } : entry) })
  }
  function end() {
    if (drag.current) { const before = drag.current.before; setPast((history) => [...history.slice(-49), before]); setFuture([]); setMessage("저장하지 않은 변경") }
    drag.current = null
  }
  function add(asset: SceneAsset) {
    if (layout.items.length >= 200) { setMessage("배치는 최대 200개까지 지원합니다."); return }
    const placement = { x: 50, y: Math.round(scrollY + 120), width: clamp(asset.width, 8, 320), rotation: 0 }
    const entry: SceneItem = { id: crypto.randomUUID(), name: asset.file, file: asset.file, still: asset.still,
      width: asset.width, height: asset.height, foreground: false, desktop: placement,
      mobile: { ...placement, width: Math.min(placement.width, 240) } }
    commit({ ...layout, items: [...layout.items, entry] }); setSelected(entry.id); setPreview(false)
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
    if (!item) return
    const items = [...layout.items], index = items.indexOf(item), target = clamp(index + direction, 0, items.length - 1)
    ;[items[index], items[target]] = [items[target], items[index]]
    commit({ ...layout, items })
  }
  const filtered = catalog.filter((asset) => (group === "all" || asset.group === group) &&
    (!animated || asset.frames > 1) && asset.file.toLowerCase().includes(query.toLowerCase()))
  const groups = [...new Set(catalog.map((asset) => asset.group))].sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
  return <>
    {!preview && <div className="scene-handles" aria-label="배치 캔버스">
      {layout.items.filter((entry) => !entry[mode].hidden).map((entry, index) => {
        const p = entry[mode]
        const rendered = resolvePlacement(p, geometry.boxes, geometry.viewport)
        return <button key={entry.id} className={`scene-handle ${selected === entry.id ? "is-selected" : ""}`}
          aria-label={`이동: ${entry.name}`} aria-pressed={selected === entry.id}
          style={{ left: rendered.left, top: rendered.top, width: rendered.width, height: rendered.width * entry.height / entry.width, transform: `translateX(-50%) rotate(${p.rotation}deg)`, zIndex: index }}
          onPointerDown={(event) => start(event, entry)} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
          onFocus={() => setSelected(entry.id)} onKeyDown={(event) => {
            if (!event.key.startsWith("Arrow")) return
            event.preventDefault()
            const step = event.shiftKey ? 10 : 1
            place(movePlacement(p, event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0,
              event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0, geometry.boxes, geometry.viewport))
          }} />
      })}
    </div>}
    <div className="scene-toolbar" role="toolbar" aria-label="배치 편집">
      <strong>배치 편집 · {mobile ? "모바일" : "데스크톱"}</strong>
      <button onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "패널 접기" : "에셋 / 속성"}</button>
      <button onClick={() => setPreview(!preview)} aria-pressed={preview}>{preview ? "편집으로" : "미리보기"}</button>
      <button onClick={save}>브라우저에 저장</button>
      <a href={withBasePath("/")}>홈으로 ↗</a>
    </div>
    {open && <aside className="scene-panel" aria-label="에셋과 배치 속성">
      <h1>Scene editor</h1>
      <p className="scene-help">이미지를 선택한 뒤 드래그하세요. 방향키로 1px, Shift와 함께 10px 이동합니다. 560px 이하 화면에서는 모바일 위치를 별도로 편집합니다. 편집창 오른쪽 아래 모서리를 드래그하면 창 크기도 바뀝니다.</p>
      <div className="scene-actions">
        <button disabled={!past.length} onClick={() => { const last = past.at(-1)!; setPast(past.slice(0, -1)); setFuture([...future, layout]); onChange(last); setMessage("저장하지 않은 변경") }}>되돌리기</button>
        <button disabled={!future.length} onClick={() => { const next = future.at(-1)!; setFuture(future.slice(0, -1)); setPast([...past, layout]); onChange(next); setMessage("저장하지 않은 변경") }}>다시 실행</button>
        <button onClick={() => commit(defaults)}>기본 배치</button>
      </div>
      <p role="status" className="scene-status">{message}</p>
      <details className="scene-save" open><summary>배경 / 패널 레이아웃</summary>
        <p>현재 화면 크기의 설정입니다. 너비는 화면에 맞춰 줄어들며, 높이는 내용이 잘리지 않도록 최소 높이로 적용됩니다. 왼쪽 패널 너비는 두 열 화면(900px 초과)에 적용됩니다.</p>
        {["배경", "패널"].map((section) => <fieldset key={section} className="scene-properties"><legend>{section}</legend>
          <div className="scene-fields">{(Object.entries(layoutFields) as [LayoutField, (typeof layoutFields)[LayoutField]][]).filter(([, field]) => field.group === section).map(([key, field]) => {
            const value = layout.settings?.[mode]?.[key] ?? field[mode]
            return <label key={key}>{field.label} ({field.unit})<input key={`${mode}-${value}`} type="number" min={field.min} max={field.max} step="1" defaultValue={value}
              onBlur={(event) => {
                const next = event.target.valueAsNumber
                if (!Number.isFinite(next)) { event.target.value = String(value); return }
                const bounded = clamp(next, field.min, field.max)
                event.target.value = String(bounded)
                if (bounded !== value) commit({ ...layout, settings: { ...layout.settings, [mode]: { ...layout.settings?.[mode], [key]: bounded } } })
              }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur() }} /></label>
          })}</div>
        </fieldset>)}
        <button onClick={() => commit({ ...layout, settings: { ...layout.settings, [mode]: {} } })}>이 화면의 배경 / 패널 초기화</button>
      </details>
      <label>배치한 에셋 ({layout.items.length})<select value={selected || ""} onChange={(event) => setSelected(event.target.value)}><option value="">선택</option>{layout.items.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
      {item && <fieldset className="scene-properties"><legend>{item.name}</legend>
        <label>붙일 영역<select aria-label="붙일 영역" value={item[mode].anchor || ""} onChange={(event) => place(attachPlacement(item[mode], (event.target.value || undefined) as SceneAnchor | undefined, geometry.boxes, geometry.viewport))}>
          <option value="">화면 전체 (기존 좌표)</option>{Object.entries(sceneAnchors).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select></label>
        {item[mode].anchor && <p className="scene-help">위치는 선택한 영역의 가로·세로 %입니다. 크기는 FHD 기준이며 좁은 영역에 맞춰 줄어듭니다. 왼쪽 패널에 붙인 앞쪽 장식은 다른 페이지에서도 패널 위에 표시됩니다.</p>}
        <div className="scene-fields">{([
          ["x", "가로 위치 (%)", item[mode].anchor ? -1000 : -50, item[mode].anchor ? 1000 : 150, .1], ["y", item[mode].anchor ? "세로 위치 (%)" : "세로 위치 (px)", item[mode].anchor ? -50000 : 0, 50000, item[mode].anchor ? .1 : 1],
          ["width", "너비 (px)", 8, 2400, 1], ["rotation", "회전 (°)", -180, 180, 1],
        ] as const).map(([key, label, min, max, step]) => <label key={key}>{label}<input key={`${item.id}-${mode}-${item[mode][key]}`} type="number" min={min} max={max} step={step} defaultValue={Math.round(item[mode][key] * 10) / 10}
          onBlur={(event) => {
            const value = event.target.valueAsNumber
            if (Number.isFinite(value)) place({ [key]: clamp(value, min, max) })
            else event.target.value = String(item[mode][key])
          }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur() }} /></label>)}</div>
        <label><input type="checkbox" checked={item.foreground} onChange={(event) => patch({ foreground: event.target.checked })} /> 본문 위에 배치</label>
        <label><input type="checkbox" checked={!!item[mode].hidden} onChange={(event) => place({ hidden: event.target.checked })} /> 이 화면 크기에서 숨기기</label>
        <div className="scene-actions"><button onClick={() => reorder(-1)}>뒤로</button><button onClick={() => reorder(1)}>앞으로</button>
          <button onClick={() => { commit({ ...layout, items: layout.items.filter((entry) => entry.id !== item.id) }); setSelected(null) }}>삭제</button>
          <a href={withBasePath(assetPath(item.file))} download>원본 저장</a></div>
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
            if (file.size > 1000000) throw new Error("배치 파일이 너무 큽니다.")
            const next = parseLayout(JSON.parse(await file.text()))
            const known = new Set(catalog.map((asset) => asset.file))
            const stills = new Set(catalog.map((asset) => asset.still))
            if (!catalog.length || next.items.some((entry) => !known.has(entry.file) || !stills.has(entry.still))) throw new Error("보관함에 없는 에셋입니다. 에셋 로딩 후 다시 시도해 주세요.")
            commit(next); setSelected(next.items[0]?.id || null)
          } catch (error) { setMessage(error instanceof Error ? error.message : "파일을 읽지 못했습니다.") }
        }} />
      </details>
      <h2>에셋 보관함 ({catalog.length.toLocaleString()})</h2>
      <a href={withBasePath("/asset/camerons-world/archive.zip")} download>전체 에셋 ZIP 저장</a>
      <label>파일 검색<input type="search" value={query} placeholder="예: 10/6, bg, cat" onChange={(event) => { setQuery(event.target.value); setPage(0) }} /></label>
      <label>원본 구역<select value={group} onChange={(event) => { setGroup(event.target.value); setPage(0) }}><option value="all">전체</option>{groups.map((value) => <option key={value} value={value}>{value === "10" ? "10 · 노을" : value === "11" ? "11 · 바다" : value === "12" ? "12 · 물결" : value}</option>)}</select></label>
      <label><input type="checkbox" checked={animated} onChange={(event) => { setAnimated(event.target.checked); setPage(0) }} /> 움직이는 에셋만</label>
      {catalogStatus && <p role="status">{catalogStatus}</p>}
      <div className="asset-grid">{filtered.slice(page * 36, page * 36 + 36).map((asset) => <button key={asset.id} onClick={() => add(asset)} title={`추가: ${asset.file} (${asset.width}×${asset.height})`} aria-label={`추가: ${asset.file}`}>
        <Image src={withBasePath(assetPath(asset.thumbnail))} alt="" width={160} height={120} unoptimized loading="lazy" />
        <span>{asset.file.replace("img/content/", "")}</span>{asset.frames > 1 && <small>GIF</small>}
      </button>)}</div>
      <div className="scene-actions"><button disabled={page === 0} onClick={() => setPage(page - 1)}>이전</button><span>{filtered.length ? page + 1 : 0} / {Math.ceil(filtered.length / 36)}</span><button disabled={(page + 1) * 36 >= filtered.length} onClick={() => setPage(page + 1)}>다음</button></div>
    </aside>}
  </>
}
