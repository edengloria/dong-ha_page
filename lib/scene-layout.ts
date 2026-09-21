export type Placement = { x: number; y: number; width: number; rotation: number; hidden?: boolean }
export type SceneItem = {
  id: string; name: string; file: string; still: string; width: number; height: number
  foreground: boolean; desktop: Placement; mobile: Placement
}
export type SceneLayout = { version: 1; items: SceneItem[] }
export type SceneAsset = {
  id: string; file: string; still: string; thumbnail: string; width: number; height: number
  frames: number; group: string; source: string
}
export const SCENE_STORAGE = "dongha-scene-v1"
export const SCENE_EVENT = "dongha-scene-change"
export const assetPath = (file: string) => `/asset/camerons-world/archive/${file}`

const safeFile = (value: unknown): value is string => typeof value === "string" &&
  /^[a-zA-Z0-9_./@+()-]+\.(?:png|gif|jpe?g|webp|svg)$/i.test(value) && !value.includes("..") && !value.startsWith("/")
const numberIn = (value: unknown, min: number, max: number) => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
function isPlacement(value: unknown): value is Placement {
  if (!value || typeof value !== "object") return false
  const p = value as Placement
  return numberIn(p.x, -50, 150) && numberIn(p.y, 0, 50000) && numberIn(p.width, 8, 2400) &&
    numberIn(p.rotation, -180, 180) && (p.hidden === undefined || typeof p.hidden === "boolean")
}
export function parseLayout(value: unknown): SceneLayout {
  if (!value || typeof value !== "object") throw new Error("올바른 배치 파일이 아닙니다.")
  const layout = value as SceneLayout
  if (layout.version !== 1 || !Array.isArray(layout.items) || layout.items.length > 200) throw new Error("배치는 최대 200개까지 지원합니다.")
  const ids = new Set<string>()
  for (const item of layout.items) {
    if (!item || typeof item.id !== "string" || !/^[\w-]{1,100}$/.test(item.id) || ids.has(item.id) ||
      typeof item.name !== "string" || item.name.length > 120 || !safeFile(item.file) || !safeFile(item.still) ||
      !numberIn(item.width, 1, 50000) || !numberIn(item.height, 1, 50000) || typeof item.foreground !== "boolean" ||
      !isPlacement(item.desktop) || !isPlacement(item.mobile)) throw new Error("배치의 이미지 경로나 위치 값이 올바르지 않습니다.")
    ids.add(item.id)
  }
  return layout
}
