export const sceneFonts = {
  times: '"Times New Roman", Times, serif',
  arial: 'Arial, Helvetica, sans-serif',
  courier: '"Courier New", Courier, monospace',
  verdana: 'Verdana, Arial, sans-serif',
} as const
export type SceneFont = keyof typeof sceneFonts
export type CustomContent =
  | { kind: "image"; src: string; still: string }
  | { kind: "text"; text: string; font: SceneFont; fontSize: number; color: string; background: string; align: "left" | "center" | "right"; bold: boolean }
export type SceneAppearance = {
  font?: SceneFont; textColor?: string; linkColor?: string; visitedColor?: string
  mainColor?: string; sidebarColor?: string; borderColor?: string
  borderStyle?: "none" | "solid" | "inset" | "outset" | "ridge" | "groove" | "double"
}
export const appearanceColors = {
  textColor: ["본문 글자", "#000000"], linkColor: ["링크", "#0000ee"], visitedColor: ["방문한 링크", "#551a8b"],
  mainColor: ["본문 배경", "#efecdf"], sidebarColor: ["왼쪽 배경", "#e1dfcf"], borderColor: ["테두리", "#b9b6ac"],
} as const
export const borderStyles = ["none", "solid", "inset", "outset", "ridge", "groove", "double"] as const
export const MAX_LAYOUT_BYTES = 4_000_000
export const safeColor = (value: unknown): value is string => typeof value === "string" && /^#[\da-f]{6}$/i.test(value)
// Raster uploads are portable inside JSON. SVG/HTML and external image URLs are not executable inputs.
export const safeImage = (value: unknown): value is string => typeof value === "string" && value.length <= 2_800_000 &&
  /^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
export function safeHref(value: unknown): value is string {
  if (typeof value !== "string" || !value || value.length > 2048 || /[\s\\<>"'\u0000-\u001f]/.test(value)) return false
  if (value.startsWith("/") && !value.startsWith("//")) return true
  if (/^#[\w-]+$/.test(value)) return true
  try { return ["https:", "http:", "mailto:"].includes(new URL(value).protocol) } catch { return false }
}
export function validContent(value: unknown): value is CustomContent {
  if (!value || typeof value !== "object") return false
  const c = value as CustomContent
  if (c.kind === "image") return safeImage(c.src) && safeImage(c.still)
  return c.kind === "text" && typeof c.text === "string" && c.text.length <= 4000 &&
    Object.hasOwn(sceneFonts, c.font) && Number.isFinite(c.fontSize) && c.fontSize >= 8 && c.fontSize <= 160 &&
    safeColor(c.color) && (c.background === "transparent" || safeColor(c.background)) &&
    ["left", "center", "right"].includes(c.align) && typeof c.bold === "boolean"
}
export function validAppearance(value: unknown): value is SceneAppearance {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  return Object.entries(value).every(([key, entry]) => key === "font" ? typeof entry === "string" && Object.hasOwn(sceneFonts, entry)
    : key === "borderStyle" ? borderStyles.includes(entry) : Object.hasOwn(appearanceColors, key) && safeColor(entry))
}
export function appearanceCss(appearance: SceneAppearance = {}) {
  return [
    `--scene-font:${appearance.font ? sceneFonts[appearance.font] : "initial"}`,
    `--scene-borderStyle:${appearance.borderStyle || "initial"}`,
    ...Object.keys(appearanceColors).map((key) => `--scene-${key}:${appearance[key as keyof typeof appearanceColors] || "initial"}`),
  ].join(";")
}
