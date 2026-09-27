"use client"

import type { SceneItem, SceneLayout } from "@/lib/scene-layout"
import { appearanceColors, borderStyles, sceneFonts, safeHref, type CustomContent, type SceneFont } from "@/lib/scene-content"

// Measure at the unscaled authored width, so text uses the same geometry in both renderers.
export function fitText(item: SceneItem): SceneItem {
  if (item.custom?.kind !== "text") return item
  const c = item.custom, probe = document.createElement("span")
  probe.textContent = c.text || " "
  Object.assign(probe.style, { position: "fixed", visibility: "hidden", pointerEvents: "none", width: `${item.width}px`,
    fontFamily: sceneFonts[c.font], fontSize: `${c.fontSize}px`, fontWeight: c.bold ? "bold" : "normal", lineHeight: "1.2", whiteSpace: "pre-wrap", overflowWrap: "anywhere" })
  document.body.append(probe)
  const height = Math.ceil(probe.getBoundingClientRect().height)
  probe.remove()
  return { ...item, height: Math.max(1, height) }
}

export async function uploadedImage(file: File): Promise<Pick<SceneItem, "custom" | "width" | "height" | "name">> {
  if (!["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.type)) throw new Error("PNG, JPEG, GIF, WebP 이미지를 선택해 주세요.")
  if (file.size > 2_000_000) throw new Error("이미지 한 장은 2MB까지 지원합니다. 크기를 줄인 뒤 추가해 주세요.")
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("이미지를 읽지 못했습니다."))
    reader.readAsDataURL(file)
  })
  const image = new Image(); image.src = src
  try { await image.decode() } catch { throw new Error("이미지 파일을 해석하지 못했습니다.") }
  const width = image.naturalWidth, height = image.naturalHeight
  if (width * height > 16_000_000 || width > 10000 || height > 10000) throw new Error("이미지 해상도를 1,600만 픽셀 이하로 줄여 주세요.")
  const canvas = document.createElement("canvas"), scale = Math.min(1, 1024 / Math.max(width, height))
  canvas.width = Math.max(1, Math.round(width * scale)); canvas.height = Math.max(1, Math.round(height * scale))
  const context = canvas.getContext("2d")
  if (!context) throw new Error("정지 이미지를 만들지 못했습니다.")
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return { name: file.name.slice(0, 120), width, height, custom: { kind: "image", src, still: canvas.toDataURL("image/webp", .9) } }
}

export function ContentProperties({ item, patch, message }: { item: SceneItem; patch: (change: Partial<SceneItem>) => void; message: (text: string) => void }) {
  const c = item.custom
  const textChange = (change: Partial<Extract<CustomContent, { kind: "text" }>>) => {
    if (c?.kind === "text") patch(fitText({ ...item, custom: { ...c, ...change } }))
  }
  return <>
    <label>이름 / 링크 설명<input key={item.id + item.name} defaultValue={item.name} maxLength={120} onBlur={(event) => { if (event.target.value !== item.name) patch({ name: event.target.value || "Untitled" }) }} /></label>
    {c?.kind === "text" && <>
      <label>글자 내용<textarea aria-label="글자 내용" key={item.id + c.text} defaultValue={c.text} rows={4} maxLength={4000} onBlur={(event) => { if (event.target.value !== c.text) textChange({ text: event.target.value }) }} /></label>
      <div className="scene-fields">
        <label>글꼴<select aria-label="글꼴" value={c.font} onChange={(event) => textChange({ font: event.target.value as SceneFont })}>{Object.keys(sceneFonts).map((font) => <option key={font}>{font}</option>)}</select></label>
        <label>원본 글자 크기<input key={item.id + c.fontSize} type="number" min={8} max={160} defaultValue={c.fontSize} onBlur={(event) => { if (Number.isFinite(event.target.valueAsNumber)) textChange({ fontSize: Math.min(160, Math.max(8, event.target.valueAsNumber)) }) }} /></label>
        <label>글자 색<input type="color" value={c.color} onChange={(event) => textChange({ color: event.target.value })} /></label>
        <label>글자 배경<input type="color" value={c.background === "transparent" ? "#ffffff" : c.background} onChange={(event) => textChange({ background: event.target.value })} /></label>
      </div>
      <label><input type="checkbox" checked={c.background === "transparent"} onChange={(event) => textChange({ background: event.target.checked ? "transparent" : "#ffffff" })} /> 투명한 글자 배경</label>
      <label><input type="checkbox" checked={c.bold} onChange={(event) => textChange({ bold: event.target.checked })} /> 굵게</label>
      <label>글자 정렬<select aria-label="글자 정렬" value={c.align} onChange={(event) => textChange({ align: event.target.value as typeof c.align })}><option value="left">왼쪽</option><option value="center">가운데</option><option value="right">오른쪽</option></select></label>
    </>}
    <label>직접 링크 주소<input key={item.id + item.href} type="text" placeholder="https://… 또는 /gallery/" defaultValue={item.href || ""} onBlur={(event) => {
      const href = event.target.value.trim()
      if (!href || safeHref(href)) { if (href !== (item.href || "")) patch({ href: href || undefined }) }
      else { message("링크는 http(s)://, mailto:, /경로 또는 #앵커 형식으로 입력해 주세요."); event.target.value = item.href || "" }
    }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur() }} /></label>
    <p className="scene-help">직접 주소가 있으면 아래의 기본 링크보다 우선합니다.</p>
  </>
}

export function AppearanceProperties({ layout, commit }: { layout: SceneLayout; commit: (next: SceneLayout) => void }) {
  const appearance = layout.appearance || {}
  const change = (key: string, value: string) => commit({ ...layout, appearance: { ...appearance, [key]: value } })
  return <details className="scene-save"><summary>색상 / 글꼴 / 테두리</summary>
    <p>두 화면 크기에 함께 적용됩니다. 여백·글자 크기·테두리 두께는 배경 / 패널 레이아웃에서 조절합니다.</p>
    <label>본문 글꼴<select aria-label="본문 글꼴" value={appearance.font || "times"} onChange={(event) => change("font", event.target.value)}>{Object.keys(sceneFonts).map((font) => <option key={font}>{font}</option>)}</select></label>
    <div className="scene-fields">{Object.entries(appearanceColors).map(([key, [label, fallback]]) => <label key={key}>{label}<input type="color" value={appearance[key as keyof typeof appearanceColors] || fallback} onChange={(event) => change(key, event.target.value)} /></label>)}</div>
    <label>패널 테두리<select aria-label="패널 테두리" value={appearance.borderStyle || "outset"} onChange={(event) => change("borderStyle", event.target.value)}>{borderStyles.map((style) => <option key={style}>{style}</option>)}</select></label>
    <button onClick={() => commit({ ...layout, appearance: {} })}>색상 / 글꼴 초기화</button>
  </details>
}
