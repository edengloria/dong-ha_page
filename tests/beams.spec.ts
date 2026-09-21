import { expect, test } from "@playwright/test"

test("GPU batches beams and falls back after context loss", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("canvas[data-beam-renderer]")).toBeVisible()
  test.skip(await page.locator('canvas[data-beam-renderer="canvas2d"]').count() > 0, "Accelerated WebGL2 unavailable; use PLAYWRIGHT_CHANNEL=chrome")
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

test("reduced motion stays idle across visibility and scroll events", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  const canvas = page.locator("canvas[data-beam-renderer]")
  await expect(canvas).toBeVisible()
  test.skip(await canvas.getAttribute("data-beam-renderer") !== "webgl2", "Accelerated WebGL2 unavailable")
  const draws = await canvas.evaluate(async (element) => {
    let draws = 0
    const canvas = element as HTMLCanvasElement
    const gl = canvas.getContext("webgl2")!
    const original = gl.drawArraysInstanced.bind(gl)
    gl.drawArraysInstanced = (...args) => { draws += 1; original(...args) }
    document.dispatchEvent(new Event("visibilitychange"))
    window.dispatchEvent(new Event("scroll"))
    await new Promise((resolve) => setTimeout(resolve, 300))
    gl.drawArraysInstanced = original
    return draws
  })
  expect(draws).toBe(0)
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.waitForTimeout(100)
  await page.emulateMedia({ reducedMotion: "reduce" })
  const pixels = await canvas.evaluate((element) => {
    const gl = (element as HTMLCanvasElement).getContext("webgl2")!
    const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    return pixels.some((value) => value !== 0)
  })
  expect(pixels).toBe(false)
})
