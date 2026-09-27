import reference from "@/data/scene-reference.json"
import type { Placement, SceneAnchor } from "@/lib/scene-layout"

// Cameron's World uses centred lockups and pixel offsets. The sky/sea keep
// their authored pixel size; panel lockups shrink together only when necessary.
export function fixedSceneGroup(anchor: SceneAnchor) { return anchor === "sky" || anchor === "sea" }
export function placementScale(p: Placement, width: number) {
  return p.anchor && !(p.coordinateSpace === "group" && fixedSceneGroup(p.anchor))
    ? Math.min(1, width / reference.boxes[p.anchor].width) : 1
}
export function placementSpace(p: Placement, box: { left: number; top: number; width: number; height: number }) {
  const scale = placementScale(p, box.width)
  if (!p.anchor || p.coordinateSpace !== "group") return { ...box, scale }
  const ref = reference.boxes[p.anchor], width = ref.width * scale
  // The compact sidebar can be shorter than its desktop lockup. Keep interior
  // decorations in that shorter region without stretching them as content grows.
  const height = p.anchor === "sidebar" || p.anchor === "sidebar-extras" ? Math.min(box.height, ref.height * scale) : ref.height * scale
  return { left: box.left + (box.width - width) / 2, top: box.top, width, height, scale }
}
export function sceneLength(p: Placement, value: number) {
  if (!p.anchor || (p.coordinateSpace === "group" && fixedSceneGroup(p.anchor))) return `${value}px`
  return `${value < 0 ? "max" : "min"}(${value}px, ${value / reference.boxes[p.anchor].width * 100}cqw)`
}
