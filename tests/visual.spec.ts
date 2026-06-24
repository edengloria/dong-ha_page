import { expect, test } from "@playwright/test"

const routes = [
  { path: "/", slug: "home" },
  { path: "/publications", slug: "publications" },
  { path: "/gallery", slug: "gallery" },
  { path: "/gallery/photos", slug: "gallery-photos" },
  { path: "/gallery/vinyl", slug: "gallery-vinyl" },
] as const

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const

for (const route of routes) {
  for (const viewport of viewports) {
    test(`${route.slug} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.addInitScript(() => {
        let seed = 42
        Math.random = () => {
          seed = (seed * 1664525 + 1013904223) % 4294967296
          return seed / 4294967296
        }
      })

      await page.goto(route.path, { waitUntil: "networkidle" })
      const mask = route.slug === "gallery-photos"
        ? [page.locator('img[src*="/asset/life-images/"]')]
        : []

      await expect(page).toHaveScreenshot(`${route.slug}-${viewport.name}.png`, {
        fullPage: true,
        animations: "disabled",
        mask,
        maskColor: "#111318",
        maxDiffPixelRatio: 0.005,
      })
    })
  }
}
