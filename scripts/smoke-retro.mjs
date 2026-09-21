import { chromium } from "@playwright/test"

const baseURL = process.argv[2] || "http://127.0.0.1:3102"
const browser = await chromium.launch({ channel: "chrome" })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  const routes = []
  for (const path of ["/", "/publications/", "/gallery/", "/gallery/photos/", "/gallery/vinyl/", "/gallery/admin/"]) {
    const response = await page.goto(new URL(path, baseURL).href, { waitUntil: "networkidle" })
    routes.push({ path, status: response.status() })
    if (response.status() !== 200) throw new Error(`Route failed: ${path}`)
  }
  await page.goto(new URL("/", baseURL).href, { waitUntil: "networkidle" })
  await page.locator('.beam-stage[data-renderer="wg"]').waitFor({ timeout: 20000 })
  await page.screenshot({ path: "docs/retro-remake/home-desktop.png", fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: "docs/retro-remake/home-mobile.png", fullPage: true })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(new URL("/gallery/photos/", baseURL).href, { waitUntil: "networkidle" })
  await page.screenshot({ path: "docs/retro-remake/photos-desktop.png" })
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () { window.lastAudio = this; return play.call(this) }
  })
  await page.goto(new URL("/gallery/vinyl/", baseURL).href, { waitUntil: "networkidle" })
  await page.screenshot({ path: "docs/retro-remake/vinyl-desktop.png" })
  await page.getByRole("heading", { name: "Record room", exact: true }).click()
  await page.locator(".record-card .aspect-square").first().hover()
  await page.waitForFunction(() => window.lastAudio && !window.lastAudio.paused && window.lastAudio.currentTime > .3 && window.lastAudio.volume > 0, { timeout: 20000 })
  const audio = await page.evaluate(() => ({ time: window.lastAudio.currentTime, volume: window.lastAudio.volume, host: new URL(window.lastAudio.src).host }))
  await page.mouse.move(0, 0)
  await page.waitForFunction(() => window.lastAudio.paused)
  if (errors.length) throw new Error(errors.join("\n"))
  console.log(JSON.stringify({ baseURL, routes, errors, audio, pausedOnLeave: true }, null, 2))
} finally { await browser.close() }
