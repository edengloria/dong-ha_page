import { test, expect } from "./fixtures"

test("inner-page navigation moves all decorations behind panels and home restores them", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")
  await expect(page.locator(".scene-foreground")).toHaveCount(1)
  const foregroundCount = await page.locator(".scene-foreground .scene-sprite").count()
  expect(foregroundCount).toBeGreaterThan(0)
  for (const route of ["/publications", "/gallery/photos", "/gallery/vinyl"]) {
    await page.locator(`.directory a[href="${route}/"]`).click()
    await expect(page.locator(".scene-foreground")).toHaveCount(0)
    for (const layer of await page.locator(".scene-layer").all()) await expect(layer).toHaveCSS("z-index", "2")
    await expect(page.locator(".scene-sprite")).toHaveCount(71)
  }
  await page.locator('.directory a[href="/"]').click()
  await expect(page.locator(".scene-foreground .scene-sprite")).toHaveCount(foregroundCount)
  await page.goto("/gallery/")
  await expect(page.locator(".scene-foreground")).toHaveCount(0)
  await page.goto("/scene-editor/")
  await expect(page.locator(".scene-foreground .scene-sprite")).toHaveCount(foregroundCount)
})
