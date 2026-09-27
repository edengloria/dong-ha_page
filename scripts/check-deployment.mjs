import assert from "node:assert/strict"
import { chromium, expect } from "@playwright/test"

const target = new URL(process.argv[2] || "http://127.0.0.1:3100/")
if (!target.pathname.endsWith("/")) target.pathname += "/"
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || "chrome" })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const errors = [], failures = []
page.on("pageerror", error => errors.push(error.message))
page.on("response", response => { if (new URL(response.url()).origin === target.origin && response.status() >= 400) failures.push(response.url()) })
try {
  const report = await (await page.request.get(new URL("document-build.json", target).href)).json()
  assert.equal(report.generator, "Astro")
  assert.equal(report.frameworkRuntime, false)
  assert.equal(report.visualFixture, false)
  for (const route of ["", "publications/", "gallery/photos/", "gallery/vinyl/"]) {
    await page.goto(new URL(route, target).href, { waitUntil: "networkidle" })
    await expect(page.locator(".beam-stage")).toHaveAttribute("data-renderer", /wg|gl/)
    await expect(page.locator(".beam-stage canvas")).toHaveCount(1)
    assert.equal(await page.locator("astro-island, .scene-toolbar").count(), 0)
    const hrefs = await page.locator("a[href]").evaluateAll(links => links.map(link => link.getAttribute("href")))
    assert(hrefs.filter(href => href.startsWith("/")).every(href => href.startsWith(target.pathname)))
    const before = Number(await page.locator(".beam-stage").getAttribute("data-frames"))
    await page.mouse.wheel(0, 350)
    await expect.poll(async () => Number(await page.locator(".beam-stage").getAttribute("data-frames"))).toBeGreaterThan(before + 5)
  }
  await page.goto(new URL("gallery/photos/", target).href)
  await page.locator("a.photo-print").first().click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await page.goto(new URL("scene-editor/", target).href)
  await page.getByRole("button", { name: "글자 / 링크 추가", exact: true }).click()
  await page.getByLabel("글자 내용", { exact: true }).fill("Astro deployment check")
  await page.getByRole("button", { name: "브라우저에 저장", exact: true }).click()
  await page.getByRole("link", { name: "홈으로" }).click()
  await expect(page.locator(".scene-sprite:visible").getByText("Astro deployment check", { exact: true })).toBeVisible()
  // The test uses an isolated browser context; no published data is modified.
  await page.evaluate(() => localStorage.removeItem("dongha-scene-v1"))
  assert.deepEqual(errors, [])
  assert.deepEqual(failures, [])
  console.log(`Deployment passed: ${target.href}; 4 GPU routes, scrolling, photos, editor persistence; no local resource failures`)
} finally { await browser.close() }
