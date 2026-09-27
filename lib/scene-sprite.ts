import reference from "@/data/scene-reference.json"
import type { SceneItem } from "@/lib/scene-layout"
import { sceneLength } from "@/lib/scene-group"

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
  return { left, top, width, transform: `translate(-50%, ${p.edge === "top" ? "-100%" : "0"}) rotate(${p.rotation}deg)`, zIndex: index,
    imageRendering: item.pixelated ? "pixelated" as const : "auto" as const }
}
export const blankSprite = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
