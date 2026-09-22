import { test, expect } from "./fixtures"
import layout from "../data/scene-layout.json"
import legacy from "../data/scene-layout (1).json"
import reference from "../data/scene-reference.json"
import type { Placement } from "../lib/scene-layout"

const attached = layout.items.filter((item) => (item.desktop as Placement).edge === "top")
const crab = "c6a02e22-f9ed-4422-b567-615467a90555"

test("panel-top ornaments follow the border through resize, content growth, and route changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  expect(attached).toHaveLength(9)
  for (const width of [2560, 1905, 1440, 1280, 960, 901, 900, 768, 561]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const item of attached) {
      const p = item.desktop as Placement
      const sprite = (await page.locator(`[data-scene-id="${item.id}"]:visible`).boundingBox())!
      const panel = (await page.locator(p.anchor === "main" ? ".page-sheet" : ".desk-sidebar").boundingBox())!
      const scale = Math.min(1, panel.width / reference.boxes[p.anchor!].width)
      expect(Math.abs(sprite.y + sprite.height - panel.y - p.y * scale)).toBeLessThan(1)
      if (width <= 900 && p.anchor === "main") {
        const sidebar = (await page.locator(".desk-sidebar").boundingBox())!
        expect(sprite.y).toBeGreaterThan(sidebar.y + sidebar.height)
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  const before = await page.locator('[data-edge="top"]:visible').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top))
  await page.addStyleTag({ content: ".page-sheet,.desk-sidebar {min-height:2400px} :root {--scene-rippleTop:800px!important;--scene-rippleHeight:500px!important}" })
  const after = await page.locator('[data-edge="top"]:visible').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top))
  expect(after).toEqual(before)
  await page.getByRole("link", { name: "Research desk" }).click()
  for (const item of attached) {
    const p = item.desktop as Placement
    const sprite = (await page.locator(`[data-scene-id="${item.id}"]:visible`).boundingBox())!
    const panel = (await page.locator(p.anchor === "main" ? ".page-sheet" : ".desk-sidebar").boundingBox())!
    expect(Math.abs(sprite.y + sprite.height - panel.y - p.y)).toBeLessThan(1)
  }
  await expect(page.locator(`.scene-foreground [data-scene-id="${crab}"]:visible`)).toHaveCount(1)
})

test("edge attachment can toggle without jumping and keeps the image bottom aligned after resizing", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/scene-editor/", { waitUntil: "networkidle" })
  await page.getByLabel(/배치한 에셋/).selectOption(crab)
  const sprite = page.locator(`[data-scene-id="${crab}"]:visible`)
  const before = (await sprite.boundingBox())!
  const toggle = page.getByRole("checkbox", { name: "윗변에 붙이기", exact: true })
  await toggle.uncheck()
  expect(Math.abs((await sprite.boundingBox())!.y - before.y)).toBeLessThan(1)
  await toggle.check()
  expect(Math.abs((await sprite.boundingBox())!.y - before.y)).toBeLessThan(1)
  await page.getByLabel("윗변과 아래쪽 간격 (px)", { exact: true }).fill("0")
  await page.getByLabel("윗변과 아래쪽 간격 (px)", { exact: true }).press("Enter")
  for (const size of ["original", "integer", "responsive"]) {
    await page.getByLabel("크기 방식", { exact: true }).selectOption(size)
    if (size === "integer") await page.getByLabel("정수 배율", { exact: true }).selectOption("2")
    const r = (await sprite.boundingBox())!, panel = (await page.locator(".desk-sidebar").boundingBox())!
    expect(Math.abs(r.y + r.height - panel.y)).toBeLessThan(1)
  }
  await page.getByRole("button", { name: "미리보기", exact: true }).click()
  await page.getByRole("button", { name: "편집으로", exact: true }).click()
  const handle = page.getByRole("button", { name: "이동: img/content/11/27.gif", exact: true })
  expect(Math.abs((await handle.boundingBox())!.y - (await sprite.boundingBox())!.y)).toBeLessThan(1)
  await handle.focus(); await page.keyboard.press("Shift+ArrowDown")
  await page.getByRole("button", { name: "브라우저에 저장", exact: true }).click()
  await page.reload()
  await page.getByLabel(/배치한 에셋/).selectOption(crab)
  await expect(toggle).toBeChecked()
  await expect(page.getByLabel("윗변과 아래쪽 간격 (px)", { exact: true })).toHaveValue("10")
  // Fixed-size ornaments need clearance even when their border offset shrinks.
  const toucan = "5bc1ac23-6704-4e79-a7ba-36c1b91caea2"
  await page.getByLabel(/배치한 에셋/).selectOption(toucan)
  await page.getByLabel("크기 방식", { exact: true }).selectOption("integer")
  await page.getByLabel("정수 배율", { exact: true }).selectOption("3")
  await page.setViewportSize({ width: 561, height: 1000 })
  const bird = (await page.locator(`[data-scene-id="${toucan}"]:visible`).boundingBox())!
  const sidebar = (await page.locator(".desk-sidebar").boundingBox())!
  expect(bird.y).toBeGreaterThan(sidebar.y + sidebar.height)
})

test("unchanged saved sea placements migrate while manual edits survive", async ({ page }) => {
  const saved = structuredClone(layout)
  for (const item of saved.items.filter((entry) => (entry.desktop as Placement).edge)) {
    const p = legacy.items.find((entry) => entry.id === item.id)!.desktop
    const anchor = item.id === crab ? "sidebar" : "sea", box = reference.boxes[anchor]
    item.desktop = { ...p, anchor, x: (p.x / 100 * reference.width - box.left) / box.width * 100, y: (p.y - box.top) / box.height * 100 } as typeof item.desktop
  }
  const edited = saved.items.find((item) => item.id === "coral-reef")!
  edited.desktop.x += 3
  await page.addInitScript((data) => localStorage.setItem("dongha-scene-v1", JSON.stringify(data)), saved)
  await page.goto("/", { waitUntil: "networkidle" })
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("dongha-scene-v1")!))
  expect(stored.items.find((item: {id: string}) => item.id === crab).desktop).toEqual(layout.items.find((item) => item.id === crab)!.desktop)
  expect(stored.items.find((item: {id: string}) => item.id === "coral-reef").desktop).toEqual(edited.desktop)
})
