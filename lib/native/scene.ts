import optimized from "@/data/scene-optimized.json"
import { profile } from "@/content/profile"
import { layoutCss, parseLayout, assetPath, SCENE_STORAGE, SCENE_EVENT, type SceneItem, type SceneLayout } from "@/lib/scene-layout"
import { migrateMobileScene } from "@/lib/migrate-mobile-scene"
import { migrateAnchors, sidebarPlacement } from "@/lib/scene-anchors"
import { blankSprite, spriteStyle } from "@/lib/scene-sprite"
import { withBasePath } from "@/lib/utils"

function sprite(item: SceneItem, mode: "desktop" | "mobile", index: number) {
  const p = item[mode], element = document.createElement(item.link ? "a" : "span")
  element.className = `scene-sprite ${item.id}${item.link ? " scene-image-link" : ""}`
  element.dataset.sceneId = item.id; element.dataset.anchor = p.anchor || "viewport"
  if (p.edge) element.dataset.edge = p.edge
  Object.assign(element.style, spriteStyle(item, mode, index))
  if (item.link) {
    const links = { email: `mailto:${profile.email}`, research: withBasePath("/publications/"), photos: withBasePath("/gallery/photos/"), records: withBasePath("/gallery/vinyl/") }
    const labels = { email: "Email Dong-Ha", research: "Research publications", photos: "Photo diary", records: "Record collection" }
    element.setAttribute("href", links[item.link]); element.setAttribute("aria-label", labels[item.link])
  } else element.setAttribute("aria-hidden", "true")
  const picture = document.createElement("picture")
  const media = mode === "desktop" ? "(min-width: 561px)" : "(max-width: 560px)"
  const still = document.createElement("source"), animated = document.createElement("source")
  still.media = `${media} and (prefers-reduced-motion: reduce)`; still.srcset = withBasePath(assetPath(item.still))
  animated.media = media; animated.srcset = withBasePath(assetPath((optimized as Record<string, string>)[item.file] || item.file))
  const img = new Image(item.width, item.height); img.src = blankSprite; img.alt = ""; img.loading = "lazy"
  picture.append(still, animated, img); element.append(picture)
  return element
}
export async function mountSavedScene() {
  const response = await fetch(withBasePath("/scene-published.json"))
  if (!response.ok) throw new Error("Published scene unavailable")
  const defaults = parseLayout(await response.json())
  const home = document.body.dataset.documentPage === "/"
  const render = (layout: SceneLayout) => {
    document.querySelector("#scene-layout")!.textContent = layoutCss(layout)
    document.querySelectorAll<HTMLElement>("[data-scene-slot]").forEach((slot) => {
      const anchor = slot.dataset.sceneSlot === "viewport" ? undefined : slot.dataset.sceneSlot
      const fragment = document.createDocumentFragment()
      for (const mode of ["desktop", "mobile"] as const) for (const front of [false, true]) {
        const layer = document.createElement("span")
        layer.className = `scene-layer scene-${mode}${front ? " scene-foreground" : ""}`
        layout.items.forEach((item, index) => {
          if (!item[mode].hidden && item[mode].anchor === anchor && (item.foreground && (home || sidebarPlacement(item[mode]))) === front) layer.append(sprite(item, mode, index))
        })
        if (layer.childElementCount) fragment.append(layer)
      }
      slot.replaceChildren(fragment)
    })
  }
  const read = () => {
    let layout = defaults
    try {
      const raw = localStorage.getItem(SCENE_STORAGE)
      if (raw) {
        const saved = parseLayout(JSON.parse(raw))
        layout = migrateAnchors(migrateMobileScene(saved, defaults), defaults)
        if (layout !== saved) { try { localStorage.setItem(SCENE_STORAGE, JSON.stringify(layout)) } catch {} }
      }
    } catch { /* Invalid or unavailable storage keeps the published composition. */ }
    render(layout)
  }
  read()
  window.addEventListener("storage", (event) => { if (event.key === SCENE_STORAGE || event.key === null) read() })
  window.addEventListener(SCENE_EVENT, read)
}
