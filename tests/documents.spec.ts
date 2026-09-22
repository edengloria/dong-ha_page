import { test, expect } from "./fixtures"
import { getDiscogsCollection } from "../lib/discogs"
import { getLifeImageFilenames } from "../lib/gallery"

test("public pages navigate as complete documents without framework scripts", async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  const scripts: string[] = [], requests: string[] = []
  page.on("request", (req) => { requests.push(req.url()); if (req.resourceType() === "script") scripts.push(req.url()) })
  for (const path of ["/", "/publications/", "/gallery/", "/gallery/photos/", "/gallery/vinyl/"]) {
    const response = await page.goto(path, { waitUntil: "networkidle" })
    const html = await response!.text()
    expect(html).not.toMatch(/__next_f|\/_next\/.*?\.js/)
    await expect(page.locator(".page-sheet")).toBeVisible()
    await expect(page.locator(".scene-toolbar, .scene-panel")).toHaveCount(0)
  }
  expect(scripts.length).toBeGreaterThan(0)
  expect(scripts.every((url) => new URL(url).pathname.startsWith("/scripts/"))).toBe(true)
  expect(requests.some((url) => /\/_next\/|\?_rsc=|scene-published\.json|camerons-world\/catalog/.test(url))).toBe(false)
  await page.evaluate(() => Reflect.set(window, "documentMarker", 1))
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: /Home/ }).click()
  await expect(page).toHaveURL(/\/$/)
  expect(await page.evaluate(() => Reflect.get(window, "documentMarker"))).toBeUndefined()
  const report = await (await request.get("/document-build.json")).json()
  expect(report.frameworkRuntime).toBe(false)
  expect(report.entryBytes).toBeLessThan(12000)
  // Editor and management retain their own interactive application.
  for (const route of ["/scene-editor/", "/gallery/admin/"]) {
    const html = await (await request.get(route)).text()
    expect(html).toContain("/_next/static/")
    expect(html).not.toContain("data-document-page=")
  }
})

test("every photograph and album has a working no-JavaScript document path", async ({ browser, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce" })
  const page = await context.newPage(), images: string[] = []
  await page.goto("/gallery/photos/")
  while (true) {
    images.push(...await page.locator("a.photo-print").evaluateAll((links) => links.map((link) => link.getAttribute("href")!)))
    const next = page.getByRole("link", { name: "Next >", exact: true }).first()
    if (!await next.count()) break
    await next.click()
  }
  expect(images.length).toBe(getLifeImageFilenames().length)
  expect(new Set(images).size).toBe(images.length)
  for (const release of getDiscogsCollection().releases) {
    const response = await request.get(`/gallery/vinyl/${release.instance_id}/`)
    expect(response.ok()).toBe(true)
    expect(await response.text()).toContain(`https://www.discogs.com/release/${release.id}`)
  }
  await page.goto("/gallery/vinyl/")
  await expect(page.locator("[data-preview-button]:visible")).toHaveCount(0)
  await page.locator(".record-card h2 a").first().click()
  await expect(page.locator(".record-document")).toBeVisible()
  await page.getByRole("link", { name: "< Back to the record collection" }).click()
  await expect(page.locator(".record-index")).toBeVisible()
  await context.close()
})

test("invalid saved scenes fall back and clearing storage restores the published layout", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("dongha-scene-v1", "not json"))
  await page.goto("/", { waitUntil: "networkidle" })
  await expect(page.locator(".scene-sprite:visible")).toHaveCount(71)
  await page.evaluate(async () => {
    const layout = await (await fetch("/scene-published.json")).json()
    layout.items[0].desktop.hidden = true
    localStorage.setItem("dongha-scene-v1", JSON.stringify(layout))
    window.dispatchEvent(new Event("dongha-scene-change"))
  })
  await expect(page.locator(".scene-sprite:visible")).toHaveCount(70)
  await page.evaluate(() => { localStorage.removeItem("dongha-scene-v1"); window.dispatchEvent(new Event("dongha-scene-change")) })
  await expect(page.locator(".scene-sprite:visible")).toHaveCount(71)
})
