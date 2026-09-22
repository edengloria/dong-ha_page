export const sceneAnchors = {
  sky: "노을", sea: "바다 / 물결", sidebar: "왼쪽 패널", "sidebar-extras": "왼쪽 링크 / 하단",
  main: "본문 패널", intro: "소개", research: "Research 카드", photos: "Photo 카드", records: "Record 카드",
  publications: "메인 연구 목록", footer: "페이지 하단",
} as const
export type SceneAnchor = keyof typeof sceneAnchors
export type Placement = { x: number; y: number; width: number; rotation: number; hidden?: boolean; anchor?: SceneAnchor; size?: "responsive" | "original" | "integer"; pixelScale?: number }
export const sceneLinks = { email: "이메일", research: "연구", photos: "사진", records: "바이닐" } as const
export type SceneItem = {
  id: string; name: string; file: string; still: string; width: number; height: number
  foreground: boolean; desktop: Placement; mobile: Placement
  link?: keyof typeof sceneLinks; pixelated?: boolean
}
export const layoutFields = {
  skyTop: { label: "노을 위쪽 위치", group: "배경", min: 0, max: 3000, desktop: 0, mobile: 0, unit: "px" },
  skyHeight: { label: "노을 높이", group: "배경", min: 0, max: 3000, desktop: 280, mobile: 230, unit: "px" },
  rippleTop: { label: "물결 위쪽 위치", group: "배경", min: 0, max: 5000, desktop: 280, mobile: 230, unit: "px" },
  rippleHeight: { label: "물결 높이", group: "배경", min: 0, max: 3000, desktop: 96, mobile: 96, unit: "px" },
  rippleScale: { label: "물결 무늬 배율", group: "배경", min: 25, max: 400, desktop: 100, mobile: 100, unit: "%" },
  oceanX: { label: "바다 무늬 가로 위치", group: "배경", min: -3000, max: 3000, desktop: 0, mobile: 0, unit: "px" },
  oceanY: { label: "바다 무늬 세로 위치", group: "배경", min: -3000, max: 3000, desktop: 0, mobile: 0, unit: "px" },
  beamTop: { label: "빔 위쪽 위치", group: "배경", min: -2000, max: 3000, desktop: 0, mobile: 0, unit: "px" },
  beamHeight: { label: "빔 높이", group: "배경", min: 10, max: 200, desktop: 100, mobile: 100, unit: "svh" },
  beamOpacity: { label: "빔 불투명도", group: "배경", min: 0, max: 100, desktop: 100, mobile: 100, unit: "%" },
  contentTop: { label: "패널 위쪽 위치", group: "패널", min: 0, max: 5000, desktop: 394, mobile: 334, unit: "px" },
  contentWidth: { label: "전체 패널 최대 너비", group: "패널", min: 320, max: 2400, desktop: 1240, mobile: 1240, unit: "px" },
  sidebarWidth: { label: "왼쪽 패널 너비", group: "패널", min: 160, max: 600, desktop: 210, mobile: 210, unit: "px" },
  panelGap: { label: "패널 간격", group: "패널", min: 0, max: 160, desktop: 28, mobile: 24, unit: "px" },
  mainMinHeight: { label: "본문 패널 최소 높이", group: "패널", min: 0, max: 5000, desktop: 0, mobile: 0, unit: "px" },
  sidebarMinHeight: { label: "왼쪽 패널 최소 높이", group: "패널", min: 0, max: 5000, desktop: 0, mobile: 0, unit: "px" },
} as const
export type LayoutField = keyof typeof layoutFields
export type LayoutSettings = Partial<Record<LayoutField, number>>
export type SceneLayout = { version: 1; items: SceneItem[]; settings?: { desktop?: LayoutSettings; mobile?: LayoutSettings } }

// Only validated, known numeric fields are interpolated into the stylesheet.
export function layoutCss(layout: SceneLayout) {
  const declarations = (mode: "desktop" | "mobile") => Object.entries(layoutFields).map(([key, field]) => {
    const value = layout.settings?.[mode]?.[key as LayoutField]
    return `--scene-${key}:${value === undefined ? "initial" : key === "rippleScale" ? value / 100 : `${value}${field.unit}`}`
  }).join(";")
  return `:root{${declarations("desktop")}}@media(max-width:560px){:root{${declarations("mobile")}}}`
}
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
  return (p.anchor === undefined || Object.prototype.hasOwnProperty.call(sceneAnchors, p.anchor)) &&
    (p.size === undefined || ["responsive", "original", "integer"].includes(p.size)) &&
    (p.pixelScale === undefined || (Number.isInteger(p.pixelScale) && numberIn(p.pixelScale, 1, 8))) &&
    numberIn(p.x, p.anchor ? -1000 : -50, p.anchor ? 1000 : 150) && numberIn(p.y, p.anchor ? -50000 : 0, 50000) && numberIn(p.width, 8, 2400) &&
    numberIn(p.rotation, -180, 180) && (p.hidden === undefined || typeof p.hidden === "boolean")
}
export function parseLayout(value: unknown): SceneLayout {
  if (!value || typeof value !== "object") throw new Error("올바른 배치 파일이 아닙니다.")
  const layout = value as SceneLayout
  if (layout.version !== 1 || !Array.isArray(layout.items) || layout.items.length > 200) throw new Error("배치는 최대 200개까지 지원합니다.")
  if (layout.settings !== undefined) {
    if (!layout.settings || typeof layout.settings !== "object" || Array.isArray(layout.settings)) throw new Error("레이아웃 설정이 올바르지 않습니다.")
    for (const [mode, settings] of Object.entries(layout.settings)) {
      if (!["desktop", "mobile"].includes(mode) || !settings || typeof settings !== "object" || Array.isArray(settings)) throw new Error("레이아웃 설정이 올바르지 않습니다.")
      for (const [key, value] of Object.entries(settings)) {
        const field = Object.prototype.hasOwnProperty.call(layoutFields, key) ? layoutFields[key as LayoutField] : undefined
        if (!field || !numberIn(value, field.min, field.max)) throw new Error("레이아웃 설정 값이 올바르지 않습니다.")
      }
    }
  }
  const ids = new Set<string>()
  for (const item of layout.items) {
    if (!item || typeof item.id !== "string" || !/^[\w-]{1,100}$/.test(item.id) || ids.has(item.id) ||
      typeof item.name !== "string" || item.name.length > 120 || !safeFile(item.file) || !safeFile(item.still) ||
      !numberIn(item.width, 1, 50000) || !numberIn(item.height, 1, 50000) || typeof item.foreground !== "boolean" ||
      (item.link !== undefined && !Object.prototype.hasOwnProperty.call(sceneLinks, item.link)) ||
      (item.pixelated !== undefined && typeof item.pixelated !== "boolean") ||
      !isPlacement(item.desktop) || !isPlacement(item.mobile)) throw new Error("배치의 이미지 경로나 위치 값이 올바르지 않습니다.")
    ids.add(item.id)
  }
  return layout
}
