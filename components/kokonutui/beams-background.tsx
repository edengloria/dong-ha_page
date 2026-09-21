"use client"

import { useEffect, useRef } from "react"
import type { Canvas, Picture, ThorVGNamespace } from "@thorvg/webcanvas"
import { withBasePath } from "@/lib/utils"

// ThorVG owns a global engine. Serialize startup across StrictMode mounts.
let startup = Promise.resolve()
const MAX_PIXELS = 1280 * 720
const QUALITY = [1, .75, .5]
const COUNTS = [18, 14, 10]

export default function BeamsBackground() {
  const hostRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const host = hostRef.current!
    const motion = matchMedia("(prefers-reduced-motion: reduce)")
    const abort = new AbortController()
    let disposed = false
    let canvas: Canvas | undefined
    let engine: ThorVGNamespace | undefined
    let element: HTMLCanvasElement | undefined
    let pictures: Picture[] = []
    let raf = 0, frames = 0, quality = 0, fps = 60
    let width = 1, height = 1, previous = 0, rendered = 0, sampleStart = 0, slow = 0, samples = 0
    const epoch = performance.now()
    const fixedTime = process.env.NODE_ENV !== "production"
      ? new URLSearchParams(location.search).get("beamTime") : null

    function destroyScene() {
      cancelAnimationFrame(raf)
      // Release textures while the renderer's context still exists. Context-loss
      // cleanup is best effort; it must never prevent the static fallback.
      try { canvas?.remove() } catch {}
      pictures.forEach((picture) => { try { picture.dispose() } catch {} })
      pictures = []
      try { canvas?.destroy() } catch {}
      canvas = undefined
      try { engine?.term() } catch {}
      engine = undefined
      element?.remove()
      element = undefined
    }
    function resize() {
      if (!canvas || !element) return
      const scale = Math.min(1, Math.sqrt(MAX_PIXELS / (innerWidth * innerHeight))) * QUALITY[quality]
      width = Math.max(1, Math.floor(innerWidth * scale))
      height = Math.max(1, Math.floor(innerHeight * scale))
      canvas.resize(width, height)
      element.style.width = "100%"
      element.style.height = "100%"
      host.dataset.quality = String(quality)
      if (motion.matches || fixedTime !== null) draw(fixedTime === null ? 0 : Number(fixedTime))
    }
    function draw(seconds: number) {
      if (!canvas || !element) return
      pictures.forEach((picture, index) => {
        if (index >= COUNTS[quality]) { picture.opacity(0); return }
        const phase = index * 2.39996
        const angle = -.48 + Math.sin(seconds * .08 + phase) * .045
        const sx = width * (.095 + (index % 3) * .023) / 96
        const sy = height * 2.7 / 512
        const x = ((index / COUNTS[quality] * 1.5 + seconds * .009) % 1.5 - .25) * width
        const y = -height * .8 + Math.sin(seconds * .12 + phase) * height * .14
        picture.transform({
          e11: Math.cos(angle) * sx, e12: -Math.sin(angle) * sy, e13: x,
          e21: Math.sin(angle) * sx, e22: Math.cos(angle) * sy, e23: y,
          e31: 0, e32: 0, e33: 1,
        }).opacity(Math.round(65 + 35 * (1 + Math.sin(seconds * .35 + phase))))
      })
      canvas.update().render()
      frames++
      if (frames === 1 || frames % 15 === 0) host.dataset.frames = String(frames)
    }
    function animate(now: number) {
      if (disposed || document.hidden || motion.matches || fixedTime !== null) return
      const elapsed = previous ? now - previous : 0
      previous = now
      if (elapsed > 0 && elapsed < 250) { samples++; if (elapsed > 24) slow++ }
      if (!sampleStart) sampleStart = now
      if (now - sampleStart > 3000) {
        if (samples > 60 && slow / samples > .15) {
          if (quality < 2) { quality++; resize() } else fps = 30
        }
        sampleStart = now; slow = 0; samples = 0
        host.dataset.fps = String(fps)
      }
      if (now - rendered >= 1000 / fps - 1) {
        try { draw((now - epoch) / 1000) } catch { fallback(); return }
        rendered = now
      }
      raf = requestAnimationFrame(animate)
    }
    function resume() {
      cancelAnimationFrame(raf)
      previous = 0; sampleStart = 0; slow = 0; samples = 0
      if (!canvas || disposed || document.hidden) return
      if (motion.matches || fixedTime !== null) draw(fixedTime === null ? 0 : Number(fixedTime))
      else raf = requestAnimationFrame(animate)
    }
    function fallback() {
      destroyScene()
      host.dataset.renderer = "static"
    }
    startup = startup.catch(() => {}).then(async () => {
      if (disposed) return
      try {
        const [{ default: ThorVG }, textures] = await Promise.all([
          import("@thorvg/webcanvas"),
          Promise.all([0, 1, 2].map(async (i) => {
            const response = await fetch(withBasePath(`/asset/beams/${i}.png`), { signal: abort.signal })
            if (!response.ok) throw new Error("Beam texture unavailable")
            return new Uint8Array(await response.arrayBuffer())
          })),
        ])
        if (disposed) return
        for (const renderer of ["wg", "gl"] as const) {
          if (renderer === "wg" && !Reflect.get(navigator, "gpu")) continue
          try {
            engine = await ThorVG.init({ renderer, locateFile: () => withBasePath("/vendor/thorvg/thorvg.wasm") })
            if (disposed) { destroyScene(); return }
            element = document.createElement("canvas")
            element.id = "thorvg-beams"
            element.setAttribute("aria-hidden", "true")
            host.append(element)
            canvas = new engine.Canvas("#thorvg-beams", { width: 1, height: 1, enableDevicePixelRatio: false })
            for (let i = 0; i < COUNTS[0]; i++) {
              const picture = new engine.Picture()
              pictures.push(picture)
              picture.load(textures[i % 3], { type: "png" })
              canvas.add(picture)
            }
            resize()
            draw(fixedTime === null ? 0 : Number(fixedTime))
            host.dataset.renderer = renderer
            element.addEventListener("webglcontextlost", (event) => { event.preventDefault(); fallback() }, { once: true })
            resume()
            return
          } catch {
            // init can fail after loading its singleton. Reset it before GL retry.
            if (!engine) { try { engine = await ThorVG.init() } catch {} }
            destroyScene()
            if (disposed) return
          }
        }
        fallback()
      } catch { if (!disposed) fallback() }
    })
    window.addEventListener("resize", resize)
    document.addEventListener("visibilitychange", resume)
    motion.addEventListener("change", resume)
    return () => {
      disposed = true
      abort.abort()
      window.removeEventListener("resize", resize)
      document.removeEventListener("visibilitychange", resume)
      motion.removeEventListener("change", resume)
      destroyScene()
    }
  }, [])
  return <div ref={hostRef} className="beam-stage" data-renderer="loading" aria-hidden="true" />
}
