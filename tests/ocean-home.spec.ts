import { expect, test } from "./fixtures"

test("archived sprites load locally and reduced motion selects still frames", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" })
  const animated = page.locator(".sun-birds img")
  await expect.poll(() => animated.evaluate((img: HTMLImageElement) => img.currentSrc)).toContain("/10/6.gif")
  await expect.poll(() => page.locator(".scene-sprite img").evaluateAll((images) => images.filter((img) => {
    const r = img.getBoundingClientRect()
    // Native lazy loading may intentionally skip decorations outside the viewport.
    return r.width > 0 && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight && !(img as HTMLImageElement).naturalWidth
  }).length)).toBe(0)
  await page.emulateMedia({ reducedMotion: "reduce" })
  await expect.poll(() => animated.evaluate((img: HTMLImageElement) => img.currentSrc)).toContain("/10/6.png")
  await expect(page.locator(".ocean-ripple")).toHaveCSS("background-image", /bg-still\.png/)
})
