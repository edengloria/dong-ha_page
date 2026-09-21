import { expect, test } from "./fixtures"

test("scroll suspends all large glass filters and preserves overlay opacity", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("canvas[data-beam-renderer]")).toBeVisible()
  await page.evaluate(() => window.dispatchEvent(new Event("scroll")))
  const styles = await page.evaluate(() => {
    const panels = [...document.querySelectorAll(".glass-panel")]
    return {
      filters: panels.flatMap((panel) => [null, "::before", "::after"].map((pseudo) => getComputedStyle(panel, pseudo).backdropFilter)),
      transitions: panels.map((panel) => getComputedStyle(panel).transitionDuration),
      overlayOpacity: Number(getComputedStyle(document.querySelector(".beams-overlay")!).opacity),
      overlayFilter: getComputedStyle(document.querySelector(".beams-overlay")!).backdropFilter,
    }
  })
  expect(styles.filters.every((filter) => filter === "none")).toBe(true)
  expect(styles.transitions.every((duration) => duration === "0s")).toBe(true)
  expect(styles.overlayFilter).toBe("none")
  expect(styles.overlayOpacity).toBeGreaterThanOrEqual(0.19)
  expect(styles.overlayOpacity).toBeLessThanOrEqual(0.31)
  await expect(page.locator("html")).not.toHaveClass(/scrolling/)
  await expect.poll(() => page.locator(".glass-panel").first().evaluate((panel) => getComputedStyle(panel).backdropFilter)).not.toBe("none")
})
