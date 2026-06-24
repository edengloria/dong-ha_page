"use client"

import { useEffect } from "react"

const LOW_PERF_CLASS = "low-perf"
const STORAGE_KEY = "dong-ha:low-perf-glass"
const SLOW_FRAME_MS = 28
const SLOW_FRAME_LIMIT = 8
const WARMUP_FRAMES = 24

export function PerfGuard() {
  useEffect(() => {
    const root = document.documentElement

    if (window.sessionStorage.getItem(STORAGE_KEY) === "1") {
      root.classList.add(LOW_PERF_CLASS)
      return
    }

    let frame = 0
    let slowFrames = 0
    let last = performance.now()
    let raf = 0

    const enableLowPerf = () => {
      root.classList.add(LOW_PERF_CLASS)
      window.sessionStorage.setItem(STORAGE_KEY, "1")
      cancelAnimationFrame(raf)
    }

    const tick = (now: number) => {
      const delta = now - last
      last = now
      frame += 1

      if (frame > WARMUP_FRAMES) {
        slowFrames = delta > SLOW_FRAME_MS ? slowFrames + 1 : Math.max(0, slowFrames - 1)

        if (slowFrames >= SLOW_FRAME_LIMIT) {
          enableLowPerf()
          return
        }
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [])

  return null
}
