"use client"

import { useEffect } from "react"

const LOW_PERF_CLASS = "low-perf"
const STORAGE_KEY = "dong-ha:low-perf-glass"
const SLOW_FRAME_MS = 28
const SLOW_FRAME_LIMIT = 8
const WARMUP_FRAMES = 24
const MAX_SAMPLE_FRAMES = 180
const SLOW_INTERACTION_MS = 160
const EVENT_OBSERVER_OPTIONS = {
  type: "event",
  buffered: true,
  durationThreshold: 104,
} as PerformanceObserverInit & { durationThreshold: number }

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

    let interactionObserver: PerformanceObserver | null = null

    if ("PerformanceObserver" in window) {
      interactionObserver = new PerformanceObserver((list, observer) => {
        for (const entry of list.getEntries()) {
          if (entry.duration >= SLOW_INTERACTION_MS) {
            enableLowPerf()
            observer.disconnect()
            return
          }
        }
      })
    }

    try {
      interactionObserver?.observe(EVENT_OBSERVER_OPTIONS)
    } catch {
      interactionObserver?.disconnect()
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

      if (frame >= MAX_SAMPLE_FRAMES) {
        cancelAnimationFrame(raf)
        return
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      interactionObserver?.disconnect()
    }
  }, [])

  return null
}
