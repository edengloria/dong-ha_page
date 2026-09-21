import { test, expect } from "./fixtures"

// A real, silent WAV keeps media/network timing deterministic without replacing
// HTMLAudioElement playback. Five seconds allows checking fade-in and stop.
const wav = Buffer.alloc(44 + 8000 * 5 * 2)
wav.write("RIFF", 0)
wav.writeUInt32LE(wav.length - 8, 4)
wav.write("WAVEfmt ", 8)
wav.writeUInt32LE(16, 16)
wav.writeUInt16LE(1, 20)
wav.writeUInt16LE(1, 22)
wav.writeUInt32LE(8000, 24)
wav.writeUInt32LE(16000, 28)
wav.writeUInt16LE(2, 32)
wav.writeUInt16LE(16, 34)
wav.write("data", 36)
wav.writeUInt32LE(wav.length - 44, 40)
const previewUrl = `data:audio/wav;base64,${wav.toString("base64")}`
const results = [{ previewUrl, trackName: "Bohemian Rhapsody", artistName: "Queen", collectionName: "Bohemian Rhapsody" }]

test.use({ launchOptions: { args: ["--autoplay-policy=document-user-activation-required", "--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies"] } })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      Reflect.set(window, "lastPreviewAudio", this)
      return play.call(this)
    }
  })
})

test("empty KR search falls back and blocked hover has a working play button", async ({ page }) => {
  // Browser/media-engagement policy varies across runners. Deny until a click;
  // the explicit retry and subsequent hover use real WAV playback.
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play
    let interactionAllowed = false
    document.addEventListener("click", () => { interactionAllowed = true }, { capture: true, once: true })
    HTMLMediaElement.prototype.play = function () {
      if (!interactionAllowed) {
        return Promise.reject(new DOMException("User interaction required", "NotAllowedError"))
      }
      return original.call(this)
    }
  })
  const countries: string[] = []
  await page.route("https://itunes.apple.com/search?*", async (route) => {
    const country = new URL(route.request().url()).searchParams.get("country")!
    countries.push(country)
    await route.fulfill({ json: { results: country === "kr" ? [] : results } })
  })
  await page.goto("/gallery/vinyl/")
  const card = page.locator("div.group.cursor-pointer").first()
  await card.locator(".aspect-square").first().hover()
  await expect(page.getByRole("button", { name: "Play preview", exact: true })).toBeVisible()
  await test.info().attach("blocked-preview-control", { body: await card.screenshot(), contentType: "image/png" })
  expect(countries).toEqual(["kr", "us"])
  await page.getByRole("button", { name: "Play preview", exact: true }).click()
  await expect.poll(() => page.evaluate(() => {
    const audio = Reflect.get(window, "lastPreviewAudio") as HTMLAudioElement
    return !audio.paused && audio.currentTime > 0 && audio.volume > 0
  })).toBe(true)
  // The inline control must not open the album details modal.
  await expect(page.locator(".fixed.inset-0").filter({ has: page.getByText("Tracklist", { exact: true }) })).toHaveCount(0)
  await page.mouse.move(0, 0)
  await expect.poll(() => page.evaluate(() => (Reflect.get(window, "lastPreviewAudio") as HTMLAudioElement).paused)).toBe(true)
  await card.locator(".aspect-square").first().hover()
  await expect.poll(() => page.evaluate(() => !(Reflect.get(window, "lastPreviewAudio") as HTMLAudioElement).paused)).toBe(true)
  await page.evaluate(() => (Reflect.get(window, "lastPreviewAudio") as HTMLAudioElement).dispatchEvent(new Event("error")))
  await page.getByRole("button", { name: "Retry preview" }).click()
  await expect.poll(() => page.evaluate(() => !(Reflect.get(window, "lastPreviewAudio") as HTMLAudioElement).paused)).toBe(true)
  await expect(page.getByRole("button", { name: "Retry preview" })).toHaveCount(0)
  expect(countries).toEqual(["kr", "us"])
})

test("transient search errors can be retried without reloading", async ({ page }) => {
  let failing = true
  await page.route("https://itunes.apple.com/search?*", (route) => failing
    ? route.fulfill({ status: 503, body: "Temporary failure" })
    : route.fulfill({ json: { results } }))
  await page.goto("/gallery/vinyl/")
  await page.locator("div.group.cursor-pointer .aspect-square").first().hover()
  await expect(page.getByRole("button", { name: "Retry preview" })).toBeVisible()
  failing = false
  await page.getByRole("button", { name: "Retry preview" }).click()
  await expect.poll(() => page.evaluate(() => {
    const audio = Reflect.get(window, "lastPreviewAudio") as HTMLAudioElement | undefined
    return Boolean(audio && !audio.paused && audio.currentTime > 0)
  })).toBe(true)
})

test("leaving a card cancels a pending search instead of playing late", async ({ page }) => {
  await page.route("https://itunes.apple.com/search?*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    await route.fulfill({ json: { results } }).catch(() => {})
  })
  await page.goto("/gallery/vinyl/")
  await page.mouse.click(10, 10)
  const pending = page.waitForRequest("https://itunes.apple.com/search?*")
  await page.locator("div.group.cursor-pointer .aspect-square").first().hover()
  await pending
  await page.mouse.move(0, 0)
  await page.waitForTimeout(800)
  expect(await page.evaluate(() => Reflect.get(window, "lastPreviewAudio"))).toBeUndefined()
})

test("mobile preview can be played, stopped and played again", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route("https://itunes.apple.com/search?*", (route) => route.fulfill({ json: { results } }))
  await page.goto("/gallery/vinyl/")
  const sleeve = page.locator(".record-card .aspect-square").first()
  await sleeve.click()
  await expect.poll(() => page.evaluate(() => {
    const audio = Reflect.get(window, "lastPreviewAudio") as HTMLAudioElement | undefined
    return Boolean(audio && !audio.paused && audio.currentTime > 0)
  })).toBe(true)
  await sleeve.click()
  await expect.poll(() => page.evaluate(() => (Reflect.get(window, "lastPreviewAudio") as HTMLAudioElement).paused)).toBe(true)
  await sleeve.click()
  await expect.poll(() => page.evaluate(() => !(Reflect.get(window, "lastPreviewAudio") as HTMLAudioElement).paused)).toBe(true)
})
