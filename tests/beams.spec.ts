import sharp from "sharp"
import { test, expect } from "./fixtures"

for (const backend of ["wg", "gl"]) {
  test(`${backend}: renders light and keeps animating through scrolling and resize`, async ({ page }) => {
    if (backend === "gl") await page.addInitScript(() => Object.defineProperty(navigator, "gpu", { value: undefined }))
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto("/")
    if (backend === "wg") {
      const available = await page.evaluate(async () => {
        const gpu = Reflect.get(navigator, "gpu")
        return Boolean(gpu && await gpu.requestAdapter())
      })
      test.skip(!available, "WebGPU adapter unavailable on this runner")
    }
    const stage = page.locator(".beam-stage")
    await expect(stage).toHaveAttribute("data-renderer", backend, { timeout: 20000 })
    const canvas = stage.locator("canvas")
    await expect(canvas).toHaveCount(1)
    expect(await canvas.evaluate((e) => (e as HTMLCanvasElement).width * (e as HTMLCanvasElement).height)).toBeLessThanOrEqual(921600)
    // Exclude the CSS fallback so a blank GPU canvas cannot pass this assertion.
    await page.addStyleTag({ content: ".beam-stage { background: #000 } .beam-stage::before { display: none }" })
    const stats = await sharp(await canvas.screenshot()).stats()
    expect(stats.channels.some((channel) => channel.stdev > 3)).toBe(true)
    const before = Number(await stage.getAttribute("data-frames"))
    for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, i % 2 ? -160 : 160); await page.waitForTimeout(80) }
    await expect.poll(async () => Number(await stage.getAttribute("data-frames"))).toBeGreaterThan(before)
    await page.setViewportSize({ width: 390, height: 844 })
    await expect.poll(() => canvas.evaluate((e) => (e as HTMLCanvasElement).width)).toBeLessThanOrEqual(390)
    await expect(stage).toHaveAttribute("data-renderer", backend)
  })
}

test("WebGPU initialization failure selects WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    const gpu = Reflect.get(navigator, "gpu")
    if (gpu) gpu.requestAdapter = async () => null
  })
  await page.goto("/")
  await expect(page.locator(".beam-stage")).toHaveAttribute("data-renderer", "gl", { timeout: 20000 })
})

test("GPU unavailability keeps the static background and working navigation", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "gpu", { value: undefined })
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (kind.includes("webgl")) return null
      return Reflect.apply(original, this, [kind, ...args])
    } as typeof original
  })
  await page.goto("/")
  await expect(page.locator(".beam-stage")).toHaveAttribute("data-renderer", "static", { timeout: 20000 })
  await expect(page.locator(".beam-stage canvas")).toHaveCount(0)
  await page.getByRole("link", { name: "Research desk" }).click()
  await expect(page).toHaveURL(/publications/)
})

test("WASM download failure leaves a readable page", async ({ page }) => {
  await page.route("**/thorvg.wasm", (route) => route.abort())
  await page.goto("/")
  await expect(page.locator(".beam-stage")).toHaveAttribute("data-renderer", "static", { timeout: 20000 })
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
})

test("visibility and reduced motion stop scheduling and can resume", async ({ page }) => {
  await page.goto("/")
  const stage = page.locator(".beam-stage")
  await expect(stage).toHaveAttribute("data-renderer", /wg|gl/, { timeout: 20000 })
  await expect.poll(async () => Number(await stage.getAttribute("data-frames"))).toBeGreaterThan(15)
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true })
    document.dispatchEvent(new Event("visibilitychange"))
  })
  const hiddenFrame = await stage.getAttribute("data-frames")
  await page.waitForTimeout(400)
  expect(await stage.getAttribute("data-frames")).toBe(hiddenFrame)
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false })
    document.dispatchEvent(new Event("visibilitychange"))
  })
  await expect.poll(async () => Number(await stage.getAttribute("data-frames"))).toBeGreaterThan(Number(hiddenFrame))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await expect(stage).toHaveAttribute("data-renderer", "static")
  await expect(stage.locator("canvas")).toHaveCount(0)
  const reducedFrame = await stage.getAttribute("data-frames")
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(400)
  expect(await stage.getAttribute("data-frames")).toBe(reducedFrame)
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await expect(stage).toHaveAttribute("data-renderer", /wg|gl/, { timeout: 20000 })
  await expect(stage.locator("canvas")).toHaveCount(1)
  await expect.poll(async () => Number(await stage.getAttribute("data-frames"))).toBeGreaterThan(Number(reducedFrame))
})

test("WebGL context loss releases the canvas", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "gpu", { value: undefined }))
  await page.goto("/")
  await expect(page.locator(".beam-stage")).toHaveAttribute("data-renderer", "gl", { timeout: 20000 })
  await page.locator(".beam-stage canvas").evaluate((e) => {
    (e as HTMLCanvasElement).getContext("webgl2")!.getExtension("WEBGL_lose_context")!.loseContext()
  })
  await expect(page.locator(".beam-stage")).toHaveAttribute("data-renderer", "static")
})
