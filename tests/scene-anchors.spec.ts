import { test, expect } from "./fixtures"
import reference from "../data/scene-reference.json"
import legacy from "../data/scene-layout (1).json"

test("anchoring preserves the FHD composition and follows reflowed panels", async ({ page }) => {
  await page.setViewportSize({ width: reference.width, height: 1000 })
  await page.goto("/", { waitUntil: "networkidle" })
  const positions = await page.locator(".scene-sprite").evaluateAll((sprites) => Object.fromEntries(sprites.map((sprite) => {
    const r = sprite.getBoundingClientRect()
    return [sprite.classList[1], { x: r.left + r.width / 2, y: r.top, width: r.width }]
  })))
  for (const item of legacy.items) {
    expect(Math.abs(positions[item.id].x - item.desktop.x / 100 * reference.width)).toBeLessThan(1)
    expect(Math.abs(positions[item.id].y - item.desktop.y)).toBeLessThan(2)
    expect(Math.abs(positions[item.id].width - item.desktop.width)).toBeLessThan(1)
  }
  for (const width of [2560, 1440, 1280, 960, 768]) {
    await page.setViewportSize({ width, height: 1000 })
    // Check relative position after browser layout and ResizeObserver have settled.
    await expect.poll(async () => page.evaluate(() => {
      const selectors: Record<string, string> = { research: ".room-research", photos: ".room-photos", records: ".room-records", sidebar: ".desk-sidebar" }
      return [...document.querySelectorAll('.scene-foreground .scene-sprite')].filter((el) => selectors[el.getAttribute("data-anchor")!]).every((el) => {
        const r = el.getBoundingClientRect(), anchor = document.querySelector(selectors[el.getAttribute("data-anchor")!])!.getBoundingClientRect()
        return r.left >= anchor.left - 8 && r.right <= anchor.right + 8 && r.top >= anchor.top - 25 && r.bottom <= anchor.bottom + 40
      })
    })).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test("editor reattaches without jumping and anchored keyboard edits survive saving", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/scene-editor/", { waitUntil: "networkidle" })
  const sun = page.getByRole("button", { name: "이동: Sun & birds", exact: true })
  const before = (await sun.boundingBox())!
  await page.getByLabel("붙일 영역", { exact: true }).selectOption("sea")
  const after = (await sun.boundingBox())!
  expect(Math.abs(after.x - before.x)).toBeLessThan(1)
  expect(Math.abs(after.y - before.y)).toBeLessThan(1)
  await sun.focus(); await page.keyboard.press("Shift+ArrowDown")
  expect(Math.abs((await sun.boundingBox())!.y - after.y - 10)).toBeLessThan(1)
  await page.getByRole("button", { name: "브라우저에 저장", exact: true }).click()
  await page.reload()
  await expect(page.getByLabel("붙일 영역", { exact: true })).toHaveValue("sea")
  expect(Math.abs((await sun.boundingBox())!.y - after.y - 10)).toBeLessThan(1)
})
