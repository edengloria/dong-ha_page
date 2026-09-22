"use client"

import { useLayoutEffect, useState } from "react"
import { anchorSelectors, type AnchorBoxes } from "@/lib/scene-anchors"
import type { SceneAnchor } from "@/lib/scene-layout"

export function useSceneAnchors(path: string, layout: unknown) {
  const [geometry, setGeometry] = useState<{ boxes: AnchorBoxes; viewport: number; mobile: boolean }>({ boxes: {}, viewport: 1905, mobile: false })
  useLayoutEffect(() => {
    let frame = 0, disposed = false
    const measure = () => {
      if (disposed) return
      frame = 0
      const boxes: AnchorBoxes = {}
      for (const [name, selector] of Object.entries(anchorSelectors)) {
        const element = document.querySelector(selector)
        if (!element) continue
        const r = element.getBoundingClientRect()
        if (r.width && r.height) boxes[name as SceneAnchor] = { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height }
      }
      const next = { boxes, viewport: document.documentElement.clientWidth, mobile: matchMedia("(max-width: 560px)").matches }
      setGeometry((old) => JSON.stringify(old) === JSON.stringify(next) ? old : next)
    }
    const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(measure) }
    const resize = new ResizeObserver(schedule)
    const observe = () => {
      resize.disconnect()
      document.querySelectorAll(Object.values(anchorSelectors).join(",") + ",.site-wrap,.site-grid").forEach((element) => resize.observe(element))
      schedule()
    }
    const mutations = new MutationObserver(observe)
    mutations.observe(document.body, { childList: true, subtree: true })
    observe(); measure()
    window.addEventListener("resize", schedule)
    document.fonts.ready.then(schedule)
    return () => { disposed = true; cancelAnimationFrame(frame); resize.disconnect(); mutations.disconnect(); window.removeEventListener("resize", schedule) }
  }, [path, layout])
  return geometry
}
