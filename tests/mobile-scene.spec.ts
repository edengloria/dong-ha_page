import { test, expect } from "./fixtures"
import legacy from "../data/scene-layout (1).json"
import current from "../data/scene-layout.json"

test("mobile decorations stay apart and above the content at narrow widths", async ({ page }) => {
  for (const width of [320, 390, 560]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto("/")
    await expect(page.locator(".scene-sprite:visible")).toHaveCount(9)
    const boxes = await page.locator(".scene-sprite:visible").evaluateAll((sprites) => sprites.map((sprite) => {
      const r = sprite.getBoundingClientRect()
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
    }))
    const content = (await page.locator(".desk-sidebar").boundingBox())!
    for (const [index, box] of boxes.entries()) {
      expect(box.left).toBeGreaterThanOrEqual(0)
      expect(box.right).toBeLessThanOrEqual(width)
      expect(box.bottom).toBeLessThan(content.y)
      for (const other of boxes.slice(index + 1)) {
        expect(box.right <= other.left || other.right <= box.left || box.bottom <= other.top || other.bottom <= box.top).toBe(true)
      }
    }
  }
  expect(current.settings).toEqual(legacy.settings)
})

test("previous saved mobile export is repaired without changing desktop edits", async ({ page }) => {
  const saved = structuredClone(legacy)
  saved.items[0].desktop.x = 25
  await page.addInitScript((layout) => localStorage.setItem("dongha-scene-v1", JSON.stringify(layout)), saved)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  await expect(page.locator(".scene-sprite:visible")).toHaveCount(9)
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("dongha-scene-v1")!).items[0].mobile)).toEqual(current.items[0].mobile)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("dongha-scene-v1")!))
  expect(stored.items[0].desktop.x).toBe(25)
  expect(stored.items[0].mobile).toEqual(current.items[0].mobile)
})

test("independently edited mobile layout is preserved", async ({ page }) => {
  const saved = structuredClone(legacy)
  saved.items[0].mobile.y = 42
  await page.addInitScript((layout) => localStorage.setItem("dongha-scene-v1", JSON.stringify(layout)), saved)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  await expect(page.locator(".sun-birds:visible")).toHaveCSS("top", "42px")
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("dongha-scene-v1")!))
  expect(stored.items.map((item: { mobile: unknown }) => item.mobile)).toEqual(saved.items.map((item) => item.mobile))
})
