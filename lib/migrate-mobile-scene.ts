import previous from "@/data/scene-mobile-before-spacing.json"
import type { Placement, SceneLayout } from "@/lib/scene-layout"

const samePlacement = (a: Placement, b: Placement) =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.rotation === b.rotation && !!a.hidden === !!b.hidden

// Upgrade only the unchanged mobile export that shipped with overlapping sprites.
// Preserve independently edited mobile layouts and every desktop placement.
export function migrateMobileScene(saved: SceneLayout, defaults: SceneLayout): SceneLayout {
  if (saved.items.length !== previous.length || !previous.every((old) => {
    const item = saved.items.find((entry) => entry.id === old.id && entry.file === old.file)
    return item && samePlacement(item.mobile, old.mobile)
  })) return saved
  return { ...saved, items: saved.items.map((item) => {
    const replacement = defaults.items.find((entry) => entry.id === item.id)
    return replacement ? { ...item, mobile: { ...replacement.mobile } } : item
  }) }
}
