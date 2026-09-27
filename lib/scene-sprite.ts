import reference from "@/data/scene-reference.json"
import type { SceneItem } from "@/lib/scene-layout"
import { sceneLength } from "@/lib/scene-group"
import { sceneFonts } from "@/lib/scene-content"

// The editor's React preview and public documents share the same coordinates.
export function spriteStyle(item: SceneItem, mode: "desktop" | "mobile", index: number) {
  const p = item[mode]
  const width = p.size === "original" ? `${item.width}px` : p.size === "integer" ? `${item.width * (p.pixelScale || 1)}px`
    : sceneLength(p, p.width)
  const group = p.coordinateSpace === "group" && p.anchor ? reference.boxes[p.anchor] : undefined
  const left = group ? `calc(50% + ${sceneLength(p, (p.x / 100 - .5) * group.width)})` : `${p.x}%`
  let top = p.edge === "top" && p.anchor ? sceneLength(p, p.y)
    : group ? sceneLength(p, p.y / 100 * group.height) : `${p.y}${p.anchor ? "%" : "px"}`
  if (group && !p.edge && (p.anchor === "sidebar" || p.anchor === "sidebar-extras")) top = `${p.y < 0 ? "max" : "min"}(${top}, ${p.y}%)`
  return { left, top, width, transform: `translate(-50%, ${p.edge === "top" ? "-100%" : "0"}) rotate(${p.rotation}deg) scale(${item.flipX ? -1 : 1}, ${item.flipY ? -1 : 1})`, zIndex: index, opacity: item.opacity ?? 1,
    imageRendering: item.pixelated ? "pixelated" as const : "auto" as const }
}
export function textStyle(item: SceneItem, mode: "desktop" | "mobile") {
  if (item.custom?.kind !== "text") return {}
  const c = item.custom, p = item[mode]
  const width = p.size === "original" ? item.width : p.size === "integer" ? item.width * (p.pixelScale || 1) : p.width
  const length = (n: number) => p.size === "original" || p.size === "integer" ? `${n}px` : sceneLength(p, n)
  return { display: "block", height: length(width * item.height / item.width), fontSize: length(c.fontSize * width / item.width),
    fontFamily: sceneFonts[c.font], color: c.color, backgroundColor: c.background, textAlign: c.align,
    fontWeight: c.bold ? "bold" : "normal", lineHeight: "1.2", whiteSpace: "pre-wrap" as const, overflowWrap: "anywhere" as const, overflow: "hidden" }
}
export const blankSprite = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
