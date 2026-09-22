import reference from "@/data/scene-reference.json"
import type { Placement, SceneAnchor, SceneLayout } from "@/lib/scene-layout"

export type AnchorBox = { left: number; top: number; width: number; height: number }
export type AnchorBoxes = Partial<Record<SceneAnchor, AnchorBox>>
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
export const anchorSelectors: Record<SceneAnchor, string> = {
  sky: ".sunset-sky", sea: ".ocean-ripple", sidebar: ".desk-sidebar", "sidebar-extras": ".sidebar-extras",
  main: ".page-sheet", intro: ".intro-note", research: ".room-research", photos: ".room-photos", records: ".room-records",
  publications: '[aria-label="On the research desk"]', footer: ".ocean-credit",
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
export function resolvePlacement(p: Placement, boxes: AnchorBoxes, viewport: number) {
  if (!p.anchor) return { left: p.x / 100 * viewport, top: p.y, width: p.width, scale: 1 }
  const box = anchorBox(p.anchor, boxes)
  const scale = Math.min(1, box.width / reference.boxes[p.anchor].width)
  return { left: box.left + p.x / 100 * box.width, top: box.top + p.y / 100 * box.height, width: p.width * scale, scale }
}
export function movePlacement(p: Placement, dx: number, dy: number, boxes: AnchorBoxes, viewport: number): Placement {
  const box = p.anchor ? anchorBox(p.anchor, boxes) : { width: viewport, height: 100 }
  return { ...p, x: clamp(p.x + dx / Math.max(1, box.width) * 100, p.anchor ? -1000 : -50, p.anchor ? 1000 : 150),
    y: clamp(p.y + dy / Math.max(1, box.height) * 100, p.anchor ? -50000 : 0, 50000) }
}
export function attachPlacement(p: Placement, anchor: SceneAnchor | undefined, boxes: AnchorBoxes, viewport: number): Placement {
  const old = resolvePlacement(p, boxes, viewport)
  if (!anchor) return { ...p, anchor: undefined, x: clamp(old.left / viewport * 100, -50, 150), y: clamp(old.top, 0, 50000), width: clamp(old.width, 8, 2400) }
  const box = anchorBox(anchor, boxes)
  const scale = Math.min(1, box.width / reference.boxes[anchor].width)
  return { ...p, anchor, x: clamp((old.left - box.left) / Math.max(1, box.width) * 100, -1000, 1000),
    y: clamp((old.top - box.top) / Math.max(1, box.height) * 100, -50000, 50000), width: clamp(old.width / Math.max(.01, scale), 8, 2400) }
}
export function sidebarPlacement(p: Placement) { return p.anchor === "sidebar" || p.anchor === "sidebar-extras" }

// Migrate only unchanged FHD coordinates from the published export. Custom edits survive.
export function migrateAnchors(saved: SceneLayout, defaults: SceneLayout): SceneLayout {
  let changed = false
  const items = saved.items.map((item) => {
    const next = defaults.items.find((entry) => entry.id === item.id && entry.file === item.file)
    if (!next?.desktop.anchor || item.desktop.anchor) return item
    const original = resolvePlacement(next.desktop, reference.boxes, reference.width)
    if (Math.abs(item.desktop.x / 100 * reference.width - original.left) > .01 ||
      Math.abs(item.desktop.y - original.top) > .01 || Math.abs(item.desktop.width - original.width) > .01 ||
      item.desktop.rotation !== next.desktop.rotation || !!item.desktop.hidden !== !!next.desktop.hidden) return item
    changed = true
    return { ...item, desktop: { ...next.desktop } }
  })
  return changed ? { ...saved, items } : saved
}
