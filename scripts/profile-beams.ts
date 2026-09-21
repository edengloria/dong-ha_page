import { readFileSync, mkdirSync, writeFileSync } from "node:fs"
import { chromium } from "@playwright/test"
import ts from "typescript"
import type { createBeamRenderer } from "../lib/beam-renderer"

// Isolated renderer comparison: excludes CSS blur, page compositing and GPU completion.
async function main() {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL })
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
    await page.setContent('<canvas id="reference"></canvas><canvas id="gpu"></canvas>')
    // tsx preserves function names with this helper inside serialized callbacks.
    await page.addScriptTag({ content: "window.__name = (fn) => fn" })
    const source = readFileSync("lib/beam-renderer.ts", "utf8")
    const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText
    await page.addScriptTag({ content: compiled.replace("export function", "function") + "\nwindow.createBeamRenderer = createBeamRenderer" })
    const result = await page.evaluate(async () => {
      const factory = (window as unknown as { createBeamRenderer: typeof createBeamRenderer }).createBeamRenderer
      const reference = document.querySelector<HTMLCanvasElement>("#reference")!
      const canvas = document.querySelector<HTMLCanvasElement>("#gpu")!
      reference.width = canvas.width = 1280
      reference.height = canvas.height = 720
      const ctx = reference.getContext("2d")!
      const renderer = factory(canvas, 64)
      if (!renderer) throw new Error("No accelerated WebGL2 context available")
      const gl = canvas.getContext("webgl2")!
      const info = gl.getExtension("WEBGL_debug_renderer_info")
      const device = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
      let seed = 42
      const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
      const beams = Array.from({ length: 44 }, () => ({
        x: random() * 1600 - 160, y: random() * 720 - 700,
        width: 54 + random() * 110, length: 1800, angle: (-35 + random() * 10) * Math.PI / 180,
        hue: 205 + random() * 48, opacity: .08 + random() * .12,
      }))
      const stops = [[0, 58, 42, 0], [.1, 56, 48, .12], [.28, 54, 54, .42], [.5, 52, 60, .72], [.72, 54, 54, .42], [.9, 56, 48, .12], [1, 58, 42, 0]]
      const drawReference = () => {
        ctx.clearRect(0, 0, 1280, 720)
        for (const beam of beams) {
          ctx.save()
          ctx.translate(beam.x, beam.y)
          ctx.rotate(beam.angle)
          const gradient = ctx.createLinearGradient(0, 0, 0, beam.length)
          for (const [position, saturation, lightness, alpha] of stops) {
            gradient.addColorStop(position, `hsla(${beam.hue}, ${saturation}%, ${lightness}%, ${alpha})`)
          }
          ctx.fillStyle = gradient
          ctx.globalAlpha = beam.opacity
          ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length)
          ctx.restore()
        }
      }
      const drawGpu = () => {
        renderer.begin(1280, 720)
        for (const b of beams) renderer.beam(b.x, b.y, b.width, b.length, b.angle, b.hue, b.opacity)
        renderer.end()
      }
      drawReference()
      drawGpu()
      // Compare premultiplied pixels before blur, allowing rasterization/8-bit rounding.
      const expected = ctx.getImageData(0, 0, 1280, 720).data
      const actual = new Uint8Array(expected.length)
      gl.readPixels(0, 0, 1280, 720, gl.RGBA, gl.UNSIGNED_BYTE, actual)
      let absoluteError = 0
      for (let y = 0; y < 720; y += 1) for (let x = 0; x < 1280; x += 1) {
        const a = (y * 1280 + x) * 4
        const b = ((719 - y) * 1280 + x) * 4
        for (let channel = 0; channel < 4; channel += 1) {
          const value = channel === 3 ? expected[a + channel] : expected[a + channel] * expected[a + 3] / 255
          absoluteError += Math.abs(value - actual[b + channel])
        }
      }
      const referenceImage = reference.toDataURL()
      const gpuImage = canvas.toDataURL()
      const cpu: number[] = [], gpu: number[] = []
      for (let frame = 0; frame < 150; frame += 1) {
        await new Promise(requestAnimationFrame)
        const measure = (draw: () => void, samples: number[]) => {
          const start = performance.now()
          draw()
          if (frame >= 30) samples.push(performance.now() - start)
        }
        // Alternate order to reduce ordering bias.
        if (frame % 2) { measure(drawReference, cpu); measure(drawGpu, gpu) }
        else { measure(drawGpu, gpu); measure(drawReference, cpu) }
      }
      const summary = (values: number[]) => {
        const sorted = [...values].sort((a, b) => a - b)
        return { meanMs: values.reduce((a, b) => a + b, 0) / values.length, p95Ms: sorted[Math.floor(sorted.length * .95)] }
      }
      const error = gl.getError()
      renderer.dispose()
      return { device, canvas2d: summary(cpu), webgl2: summary(gpu), meanAbsoluteChannelError: absoluteError / actual.length, error, referenceImage, gpuImage }
    })
    const { referenceImage, gpuImage, ...metrics } = result
    mkdirSync("test-results/beam-profile", { recursive: true })
    writeFileSync("test-results/beam-profile/reference.png", Buffer.from(referenceImage.split(",")[1], "base64"))
    writeFileSync("test-results/beam-profile/webgl2.png", Buffer.from(gpuImage.split(",")[1], "base64"))
    writeFileSync("test-results/beam-profile/metrics.json", JSON.stringify(metrics, null, 2))
    console.log(JSON.stringify(metrics, null, 2))
    if (metrics.error || metrics.meanAbsoluteChannelError > 2) throw new Error("Renderer parity failed")
  } finally {
    await browser.close()
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
