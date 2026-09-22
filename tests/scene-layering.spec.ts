import { test, expect } from "./fixtures"

test("inner pages retain sidebar decorations above panels and home restores the rest", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")
  await expect(page.locator(".scene-foreground")).toHaveCount(1)
  const foregroundCount = await page.locator(".scene-foreground .scene-sprite").count()
  expect(foregroundCount).toBeGreaterThan(0)
  for (const route of ["/publications", "/gallery/photos", "/gallery/vinyl"]) {
    await page.locator(`.directory a[href="${route}/"]`).click()
    await expect(page.locator(".scene-foreground .scene-sprite")).toHaveCount(3)
    await expect(page.locator('.scene-foreground .scene-sprite:not([data-anchor^="sidebar"])')).toHaveCount(0)
    await expect(page.locator(".scene-layer:not(.scene-foreground)")).toHaveCSS("z-index", "2")
    await expect(page.locator(".scene-sprite")).toHaveCount(71)
  }
  await page.locator('.directory a[href="/"]').click()
  await expect(page.locator(".scene-foreground .scene-sprite")).toHaveCount(foregroundCount)
  await page.goto("/gallery/")
  await expect(page.locator(".scene-foreground .scene-sprite")).toHaveCount(3)
  await page.goto("/scene-editor/")
  await expect(page.locator(".scene-foreground .scene-sprite")).toHaveCount(foregroundCount)
})
