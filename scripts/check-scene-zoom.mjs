import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { chromium } from "@playwright/test"

// Use Chrome's real page-zoom setting in a disposable profile. viewport emulation,
// deviceScaleFactor alone, CSS zoom, and pinch zoom do not test the same behavior.
const target = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3100"
const output = resolve(process.env.ZOOM_OUTPUT || ".visual-baseline/scene-zoom")
await mkdir(output, { recursive: true })
const profile = await mkdtemp(join(output, "profile-"))
const layout = JSON.parse(await readFile("data/scene-layout.json", "utf8"))
const reference = JSON.parse(await readFile("data/scene-reference.json", "utf8"))
const context = await chromium.launchPersistentContext(profile, {
  channel: process.env.PLAYWRIGHT_CHANNEL || "chrome", headless: true, viewport: null,
  reducedMotion: "reduce", args: ["--window-size=1920,1080", "--force-device-scale-factor=1"],
})
const results = []
try {
  const settings = await context.newPage(), page = await context.newPage()
  await settings.goto("chrome://settings/appearance")
  const cdp = await context.newCDPSession(page)
  const { windowId } = await cdp.send("Browser.getWindowForTarget")
  for (const width of [1920, 1366, 2560]) {
    await cdp.send("Browser.setWindowBounds", { windowId, bounds: { width, height: 1080 } })
    for (const zoom of [0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4]) {
      await settings.locator("#zoomLevel").selectOption(String(zoom))
      for (const route of ["/", "/publications/", "/gallery/photos/", "/gallery/vinyl/"]) {
        await page.goto(new URL(route, target).href)
        await page.locator(".page-sheet").waitFor()
        const actual = await page.evaluate(() => {
          const rect = (element) => element.getBoundingClientRect().toJSON()
          const sprites = [...document.querySelectorAll(".scene-sprite")].filter((el) => el.getClientRects().length).map((el) => ({
            id: el.dataset.sceneId, rect: rect(el), slot: rect(el.closest("[data-scene-slot]")), front: !!el.closest(".scene-foreground"),
          }))
          return { viewport: innerWidth, dpr: devicePixelRatio, pinchScale: visualViewport.scale,
            scrollWidth: document.documentElement.scrollWidth, sprites, sidebar: rect(document.querySelector(".desk-sidebar")),
            panel: rect(document.querySelector(".page-sheet")), editor: !!document.querySelector(".scene-toolbar"),
            font: getComputedStyle(document.querySelector(".copy-paragraph") || document.body).fontSize }
        })
        assert(Math.abs(actual.dpr - zoom) < .01, `Actual browser zoom ${actual.dpr} != ${zoom}`)
        assert.equal(actual.pinchScale, 1)
        assert(actual.scrollWidth <= actual.viewport, "Horizontal overflow")
        assert(!actual.editor, "Editor exposed on public page")
        let maxError = 0
        for (const sprite of actual.sprites) {
          const item = layout.items.find((item) => item.id === sprite.id)
          const p = item[actual.viewport <= 560 ? "mobile" : "desktop"]
          if (p.edge !== "top") continue
          const ref = reference.boxes[p.anchor], scale = Math.min(1, sprite.slot.width / ref.width)
          const expectedX = sprite.slot.left + sprite.slot.width / 2 + (p.x / 100 - .5) * ref.width * scale
          const expectedBottom = sprite.slot.top + p.y * scale
          const error = Math.max(Math.abs(sprite.rect.x + sprite.rect.width / 2 - expectedX), Math.abs(sprite.rect.bottom - expectedBottom))
          maxError = Math.max(error, maxError)
          assert(error < 1, `Ornament lost its panel at ${width}/${zoom}/${route}: ${item.id}, ${error}px`)
          if (p.anchor === "sidebar" && item.foreground) assert(sprite.front, "Sidebar decoration lost foreground on inner route")
          if (p.anchor === "main" && route !== "/") assert(!sprite.front, "Main decoration covers inner page")
          if (actual.viewport <= 900 && p.anchor === "main") assert(sprite.rect.top > actual.sidebar.bottom, "Stacked panels overlap ornaments")
        }
        results.push({ width, zoom, route, viewport: actual.viewport, dpr: actual.dpr, maxEdgeError: maxError, font: actual.font })
        if (width === 1920 && route === "/" && [1, 1.5, 2.5, 4].includes(zoom)) {
          await page.locator(".scene-sprite img").evaluateAll(async (images) => Promise.all(images.map(async (img) => { img.loading = "eager"; await img.decode() })))
          // A full-page Playwright capture resizes the viewport and defeats the
          // native zoom being checked. Capture the compositor's visible surface.
          const capture = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false })
          await writeFile(join(output, `home-${zoom * 100}.png`), Buffer.from(capture.data, "base64"))
        }
      }
    }
  }
  const { product } = await cdp.send("Browser.getVersion")
  await writeFile(join(output, "results.json"), JSON.stringify({ browser: product, target, results }, null, 2) + "\n")
  console.log(`Real Chrome zoom: ${results.length} checks passed; max panel-edge error ${Math.max(...results.map((r) => r.maxEdgeError)).toFixed(3)} CSS px. Results: ${output}`)
} finally { await context.close() }
