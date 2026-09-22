import { expect, test } from "./fixtures"

test("archived sprites load locally and reduced motion selects still frames", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" })
  const animated = page.locator(".sun-birds img")
  await expect.poll(() => animated.evaluate((img: HTMLImageElement) => img.currentSrc)).toContain("/10/6.gif")
  const broken = await page.locator(".scene-sprite img").evaluateAll((images) => images.filter((img) => !(img as HTMLImageElement).naturalWidth).length)
  expect(broken).toBe(0)
  await page.emulateMedia({ reducedMotion: "reduce" })
  await expect.poll(() => animated.evaluate((img: HTMLImageElement) => img.currentSrc)).toContain("/10/6.png")
  await expect(page.locator(".ocean-ripple")).toHaveCSS("background-image", /bg-still\.png/)
})
