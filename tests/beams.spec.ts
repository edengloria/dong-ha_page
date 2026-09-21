import type { Page } from "@playwright/test"
import { expect, test } from "./fixtures"

async function requireWebGL(page: Page) {
  // Probe the browser independently: a broken application shader must fail the
  // test, not turn a renderer fallback into a capability-based skip.
  const available = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2", {
      failIfMajorPerformanceCaveat: true,
      powerPreference: "low-power",
    })
    gl?.getExtension("WEBGL_lose_context")?.loseContext()
    return Boolean(gl)
  })
  test.skip(!available, "WebGL2 unavailable; use Chrome or the test-only software WebGL mode")
}

test("GPU batches beams and falls back after context loss", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("canvas[data-beam-renderer]")).toBeVisible()
  await requireWebGL(page)
  const gpu = page.locator('canvas[data-beam-renderer="webgl2"]')
  await expect(gpu).toBeVisible()
  const result = await gpu.evaluate(async (element) => {
    const gl = (element as HTMLCanvasElement).getContext("webgl2")!
    let draws = 0
    let instances = 0
    const original = gl.drawArraysInstanced.bind(gl)
    gl.drawArraysInstanced = (mode, first, count, instanceCount) => {
      draws += 1
      instances = instanceCount
      original(mode, first, count, instanceCount)
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
    gl.drawArraysInstanced = original
    return { draws, instances, error: gl.getError() }
  })
  expect(result.draws).toBeGreaterThan(0)
  expect(result.instances).toBeGreaterThanOrEqual(14)
  expect(result.instances).toBeLessThanOrEqual(64)
  expect(result.error).toBe(0)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => gpu.evaluate((element) => (element as HTMLCanvasElement).width)).toBe(390)
  expect(await gpu.evaluate((element) => (element as HTMLCanvasElement).getContext("webgl2")!.getError())).toBe(0)
  await gpu.evaluate((element) => {
    const gl = (element as HTMLCanvasElement).getContext("webgl2")!
    gl.getExtension("WEBGL_lose_context")!.loseContext()
  })
  await expect(page.locator('canvas[data-beam-renderer="canvas2d"]')).toBeVisible()
  await expect(gpu).toHaveCount(0)
})

test("shader initialization failure uses a separate Canvas 2D surface", async ({ page }) => {
  await page.addInitScript(() => {
    const original = WebGL2RenderingContext.prototype.getShaderParameter
    WebGL2RenderingContext.prototype.getShaderParameter = function (shader, parameter) {
      if (parameter === this.COMPILE_STATUS) return false
      return original.call(this, shader, parameter)
    }
  })
  await page.goto("/")
  await expect(page.locator('canvas[data-beam-renderer="canvas2d"]')).toBeVisible()
})

test("unavailable WebGL uses Canvas 2D", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === "webgl2") return null
      return Reflect.apply(original, this, [type, ...args])
    } as typeof original
  })
  await page.goto("/")
  const canvas = page.locator('canvas[data-beam-renderer="canvas2d"]')
  await expect(canvas).toBeVisible()
  await expect.poll(() => canvas.evaluate((element) => {
    const canvas = element as HTMLCanvasElement
    const pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data
    return pixels.some((value, index) => index % 4 === 3 && value > 0)
  })).toBe(true)
})

test("a pending scroll timer does not restart a hidden page", async ({ page }) => {
  await page.goto("/")
  const canvas = page.locator("canvas[data-beam-renderer]")
  await expect(canvas).toBeVisible()
  await canvas.evaluate((element) => {
    const canvas = element as HTMLCanvasElement
    Reflect.set(window, "beamVisibilityDraws", 0)
    const count = () => Reflect.set(window, "beamVisibilityDraws", Reflect.get(window, "beamVisibilityDraws") + 1)
    if (canvas.dataset.beamRenderer === "webgl2") {
      const gl = canvas.getContext("webgl2")!
      const original = gl.drawArraysInstanced.bind(gl)
      gl.drawArraysInstanced = (...args) => { count(); original(...args) }
    } else {
      const ctx = canvas.getContext("2d")!
      const original = ctx.fillRect.bind(ctx)
      ctx.fillRect = (...args) => { count(); original(...args) }
    }
    window.dispatchEvent(new Event("scroll"))
    Object.defineProperty(document, "hidden", { configurable: true, value: true })
    document.dispatchEvent(new Event("visibilitychange"))
  })
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => Reflect.get(window, "beamVisibilityDraws"))).toBe(0)
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false })
    document.dispatchEvent(new Event("visibilitychange"))
  })
  await expect.poll(() => page.evaluate(() => Reflect.get(window, "beamVisibilityDraws"))).toBeGreaterThan(0)
})

test("reduced motion stays idle across visibility and scroll events", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  const canvas = page.locator("canvas[data-beam-renderer]")
  await expect(canvas).toBeVisible()
  await requireWebGL(page)
  await expect(canvas).toHaveAttribute("data-beam-renderer", "webgl2")
  await canvas.evaluate((element) => {
    const canvas = element as HTMLCanvasElement
    const gl = canvas.getContext("webgl2")!
    const original = gl.drawArraysInstanced.bind(gl)
    Reflect.set(window, "beamTestDraws", 0)
    gl.drawArraysInstanced = (...args) => {
      Reflect.set(window, "beamTestDraws", Reflect.get(window, "beamTestDraws") + 1)
      original(...args)
    }
    const clear = gl.clear.bind(gl)
    gl.clear = (mask) => {
      clear(mask)
      // Read synchronously with clear. Later readPixels could report the browser's
      // automatic discard and falsely pass even if reduced motion never cleared.
      const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
      Reflect.set(window, "beamTestClearIsEmpty", !pixels.some((value) => value !== 0))
    }
    document.dispatchEvent(new Event("visibilitychange"))
    window.dispatchEvent(new Event("scroll"))
  })
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => Reflect.get(window, "beamTestDraws"))).toBe(0)
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await expect.poll(() => page.evaluate(() => Reflect.get(window, "beamTestDraws"))).toBeGreaterThan(0)
  await page.evaluate(() => Reflect.set(window, "beamTestClearIsEmpty", undefined))
  await page.emulateMedia({ reducedMotion: "reduce" })
  await expect.poll(() => page.evaluate(() => Reflect.get(window, "beamTestClearIsEmpty"))).toBe(true)
  const stoppedDraws = await page.evaluate(() => Reflect.get(window, "beamTestDraws"))
  await page.waitForTimeout(150)
  expect(await page.evaluate(() => Reflect.get(window, "beamTestDraws"))).toBe(stoppedDraws)
})
