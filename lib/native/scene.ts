import optimized from "@/data/scene-optimized.json"
import { profile } from "@/content/profile"
import { layoutCss, parseLayout, assetPath, SCENE_STORAGE, SCENE_EVENT, type SceneItem, type SceneLayout } from "@/lib/scene-layout"
import { migrateMobileScene } from "@/lib/migrate-mobile-scene"
import { migrateAnchors, sidebarPlacement } from "@/lib/scene-anchors"
import { blankSprite, spriteStyle, textStyle } from "@/lib/scene-sprite"
import { withBasePath } from "@/lib/utils"

function sprite(item: SceneItem, mode: "desktop" | "mobile", index: number) {
  const linked = !!(item.href || item.link)
  const p = item[mode], element = document.createElement(linked ? "a" : "span")
  element.className = `scene-sprite ${item.id}${linked ? " scene-image-link" : ""}`
  element.dataset.sceneId = item.id; element.dataset.anchor = p.anchor || "viewport"
  if (p.edge) element.dataset.edge = p.edge
  Object.assign(element.style, spriteStyle(item, mode, index))
  if (linked) {
    const links = { email: `mailto:${profile.email}`, research: withBasePath("/publications/"), photos: withBasePath("/gallery/photos/"), records: withBasePath("/gallery/vinyl/") }
    const labels = { email: "Email Dong-Ha", research: "Research publications", photos: "Photo diary", records: "Record collection" }
    element.setAttribute("href", item.href ? (item.href.startsWith("/") ? withBasePath(item.href) : item.href) : links[item.link!])
    if (item.custom?.kind !== "text") element.setAttribute("aria-label", item.href ? item.name : labels[item.link!])
  } else if (item.custom?.kind !== "text") element.setAttribute("aria-hidden", "true")
  if (item.custom?.kind === "text") {
    const text = document.createElement("span")
    text.textContent = item.custom.text
    Object.assign(text.style, textStyle(item, mode)); element.append(text)
    return element
  }
  const picture = document.createElement("picture")
  const media = mode === "desktop" ? "(min-width: 561px)" : "(max-width: 560px)"
  const still = document.createElement("source"), animated = document.createElement("source")
  still.media = `${media} and (prefers-reduced-motion: reduce)`; still.srcset = item.custom?.src ? item.custom.still : withBasePath(assetPath(item.still))
  animated.media = media; animated.srcset = item.custom?.src || withBasePath(assetPath((optimized as Record<string, string>)[item.file] || item.file))
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
