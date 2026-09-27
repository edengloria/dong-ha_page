import { test, expect } from "./fixtures"
import layout from "../data/scene-layout.json"

test("centred lockups keep pixel spacing as their containers grow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.setViewportSize({ width: 1905, height: 1000 })
  await page.goto("/")
  const offsets = () => page.locator(".scene-desktop .scene-sprite").evaluateAll((elements) => elements.map((el) => {
    const sprite = el.getBoundingClientRect(), slot = el.closest("[data-scene-slot]")!.getBoundingClientRect()
    return { id: el.getAttribute("data-scene-id"), x: sprite.x + sprite.width / 2 - slot.x - slot.width / 2, y: sprite.y - slot.y, width: sprite.width }
  }))
  const before = await offsets()
  await page.setViewportSize({ width: 2560, height: 1000 })
  // Grow both dimensions, independently of the page's content and font metrics.
  await page.addStyleTag({ content: ".site-wrap{max-width:2200px}.sidebar-cell{width:400px}.page-sheet,.desk-sidebar{min-height:2400px}.sky-region,.sea-region{height:700px}" })
  const after = await offsets()
  for (const first of before) {
    const item = layout.items.find((item) => item.id === first.id)!
    if (!["sky", "sea", "main", "sidebar"].includes(item.desktop.anchor)) continue
    const second = after.find((entry) => entry.id === first.id)!
    for (const key of ["x", "y", "width"] as const) expect(Math.abs(first[key] - second[key])).toBeLessThan(1)
  }
  // Sky sprites remain pixel sized as the visible window narrows.
  await page.setViewportSize({ width: 1000, height: 900 })
  await expect(page.locator(".sun-birds:visible")).toHaveCSS("width", "532px")
})

test("unchanged saved layouts upgrade to groups, preserving custom edits", async ({ page }) => {
  const old = JSON.parse(JSON.stringify(layout))
  for (const item of old.items) delete item.desktop.coordinateSpace
  const custom = old.items.find((item: {id: string}) => item.id === "palms")
  custom.desktop.x += 5
  await page.addInitScript((saved) => localStorage.setItem("dongha-scene-v1", JSON.stringify(saved)), old)
  await page.goto("/")
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("dongha-scene-v1")!).items[0].desktop.coordinateSpace)).toBe("group")
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("dongha-scene-v1")!))
  expect(saved.items.find((item: {id: string}) => item.id === "palms").desktop).toEqual(custom.desktop)
  expect(saved.items.map((item: {mobile: unknown}) => item.mobile)).toEqual(old.items.map((item: {mobile: unknown}) => item.mobile))
})

test("group mode converts coordinates without jumping at a non-reference width", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto("/scene-editor/")
  const sprite = page.locator(".sun-birds:visible")
  const before = (await sprite.boundingBox())!
  const toggle = page.getByRole("checkbox", { name: "묶음 기준 배치", exact: true })
  await toggle.uncheck()
  const legacy = (await sprite.boundingBox())!
  for (const key of ["x", "y", "width"] as const) expect(Math.abs(legacy[key] - before[key])).toBeLessThan(1)
  await toggle.check()
  const grouped = (await sprite.boundingBox())!
  for (const key of ["x", "y", "width"] as const) expect(Math.abs(grouped[key] - before[key])).toBeLessThan(1)
  const handle = page.getByRole("button", { name: "이동: Sun & birds", exact: true })
  await handle.focus(); await page.keyboard.press("Shift+ArrowRight")
  expect(Math.abs((await sprite.boundingBox())!.x - before.x - 10)).toBeLessThan(1)
  await page.getByRole("button", { name: "브라우저에 저장", exact: true }).click()
  await page.reload()
  await expect(toggle).toBeChecked()
  expect(Math.abs((await sprite.boundingBox())!.x - before.x - 10)).toBeLessThan(1)
  // An explicit choice of region coordinates must not be mistaken for an old
  // export and migrated back to group mode on the next load.
  await toggle.uncheck()
  await page.getByRole("button", { name: "브라우저에 저장", exact: true }).click()
  await page.reload()
  await expect(toggle).not.toBeChecked()
  expect(Math.abs((await sprite.boundingBox())!.x - before.x - 10)).toBeLessThan(1)
})
