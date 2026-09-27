import reference from "@/data/scene-reference.json"
import type { Placement, SceneAnchor, SceneItem, SceneLayout } from "@/lib/scene-layout"
import { placementSpace } from "@/lib/scene-group"

export type AnchorBox = { left: number; top: number; width: number; height: number }
export type AnchorBoxes = Partial<Record<SceneAnchor, AnchorBox>>
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
export const anchorSelectors: Record<SceneAnchor, string> = {
  sky: ".sky-region", sea: ".sea-region", sidebar: ".desk-sidebar", "sidebar-extras": ".sidebar-extras",
  main: ".page-sheet", intro: ".intro-note", research: ".room-research", photos: ".room-photos", records: ".room-records",
  publications: '[aria-label="On the research desk"]', footer: ".scene-footer",
}
export function anchorBox(anchor: SceneAnchor, boxes: AnchorBoxes): AnchorBox {
  if (boxes[anchor]) return boxes[anchor]!
  const original = reference.boxes[anchor]
  const main = boxes.main
  if (!main) return original
  const scale = Math.min(1, main.width / reference.boxes.main.width)
  return { left: main.left + (original.left - reference.boxes.main.left) * scale,
    top: main.top + (original.top - reference.boxes.main.top) * scale, width: original.width * scale, height: original.height * scale }
}
type ImageSize = Pick<SceneItem, "width" | "height">
export function resolvePlacement(p: Placement, boxes: AnchorBoxes, viewport: number, image: ImageSize) {
  const box = placementSpace(p, p.anchor ? anchorBox(p.anchor, boxes) : { left: 0, top: 0, width: viewport, height: 100 })
  const { scale } = box
  const width = p.size === "original" ? image.width : p.size === "integer" ? image.width * (p.pixelScale || 1) : p.width * scale
  const height = width * image.height / image.width
  const top = p.edge === "top" ? box.top + p.y * scale - height : box.top + p.y / 100 * box.height
  return { left: box.left + p.x / 100 * box.width, top, width, height, scale }
}
export function movePlacement(p: Placement, dx: number, dy: number, boxes: AnchorBoxes, viewport: number): Placement {
  const box = placementSpace(p, p.anchor ? anchorBox(p.anchor, boxes) : { left: 0, top: 0, width: viewport, height: 100 })
  return { ...p, x: clamp(p.x + dx / Math.max(1, box.width) * 100, p.anchor ? -1000 : -50, p.anchor ? 1000 : 150),
    y: clamp(p.y + (p.edge === "top" && p.anchor ? dy / Math.max(.01, box.scale) : dy / Math.max(1, box.height) * 100), p.anchor ? -50000 : 0, 50000) }
}
export function attachPlacement(p: Placement, anchor: SceneAnchor | undefined, boxes: AnchorBoxes, viewport: number, image: ImageSize, edge: Placement["edge"], grouped = true): Placement {
  const old = resolvePlacement(p, boxes, viewport, image)
  if (!anchor) return { ...p, anchor: undefined, coordinateSpace: undefined, edge: undefined, x: clamp(old.left / viewport * 100, -50, 150), y: clamp(old.top, 0, 50000), width: clamp(old.width, 8, 2400) }
  const coordinateSpace = grouped ? "group" as const : "region" as const
  const box = placementSpace({ ...p, anchor, coordinateSpace }, anchorBox(anchor, boxes))
  const { scale } = box
  return { ...p, anchor, coordinateSpace, edge, x: clamp((old.left - box.left) / Math.max(1, box.width) * 100, -1000, 1000),
    y: clamp(edge === "top" ? (old.top + old.height - box.top) / Math.max(.01, scale) : (old.top - box.top) / Math.max(1, box.height) * 100, -50000, 50000), width: clamp(old.width / Math.max(.01, scale), 8, 2400) }
}
export function sidebarPlacement(p: Placement) { return p.anchor === "sidebar" || p.anchor === "sidebar-extras" }

// Migrate only unchanged FHD coordinates from the published export. Custom edits survive.
export function migrateAnchors(saved: SceneLayout, defaults: SceneLayout): SceneLayout {
  let changed = false
  const items = saved.items.map((item) => {
    const next = defaults.items.find((entry) => entry.id === item.id && entry.file === item.file)
    if (!next?.desktop.anchor || item.desktop.coordinateSpace === "region" || (item.desktop.coordinateSpace === next.desktop.coordinateSpace &&
      (item.desktop.edge || (item.desktop.anchor && !next.desktop.edge)))) return item
    const original = resolvePlacement(next.desktop, reference.boxes, reference.width, next)
    const savedPosition = resolvePlacement(item.desktop, reference.boxes, reference.width, item)
    if (Math.abs(savedPosition.left - original.left) > .01 ||
      Math.abs(savedPosition.top - original.top) > .01 || Math.abs(savedPosition.width - original.width) > .01 ||
      (item.desktop.size || "responsive") !== (next.desktop.size || "responsive") ||
      item.desktop.rotation !== next.desktop.rotation || !!item.desktop.hidden !== !!next.desktop.hidden) return item
    changed = true
    return { ...item, desktop: { ...next.desktop } }
  })
  return changed ? { ...saved, items } : saved
}
