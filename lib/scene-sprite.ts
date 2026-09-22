import reference from "@/data/scene-reference.json"
import type { SceneItem } from "@/lib/scene-layout"

// The editor's React preview and public documents share the same coordinates.
export function spriteStyle(item: SceneItem, mode: "desktop" | "mobile", index: number) {
  const p = item[mode]
  const width = p.size === "original" ? `${item.width}px` : p.size === "integer" ? `${item.width * (p.pixelScale || 1)}px`
    : p.anchor ? `min(${p.width}px, ${p.width / reference.boxes[p.anchor].width * 100}cqw)` : `${p.width}px`
  const top = p.edge === "top" && p.anchor ? `${p.y < 0 ? "max" : "min"}(${p.y}px, ${p.y / reference.boxes[p.anchor].width * 100}cqw)` : `${p.y}${p.anchor ? "%" : "px"}`
  return { left: `${p.x}%`, top, width, transform: `translate(-50%, ${p.edge === "top" ? "-100%" : "0"}) rotate(${p.rotation}deg)`, zIndex: index,
    imageRendering: item.pixelated ? "pixelated" as const : "auto" as const }
}
export const blankSprite = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
