"use client"

import type React from "react"

import { useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface AnimatedGradientBackgroundProps {
  className?: string
  children?: React.ReactNode
  intensity?: "subtle" | "medium" | "strong"
  showHero?: boolean
}

interface Beam {
  x: number
  y: number
  width: number
  length: number
  angle: number
  speed: number
  opacity: number
  hue: number
  pulse: number
  pulseSpeed: number
  flicker: number
  flickerSpeed: number
  flickerDepth: number
  sway: number
  swaySpeed: number
  swayAmplitude: number
}

const OPACITY_MAP = {
  subtle: 0.6,
  medium: 0.75,
  strong: 1,
} as const

const BASE_BEAM_COUNT = 44
const MIN_BEAM_COUNT = 14
const MAX_BEAM_COUNT = 64
const MAX_DPR = 1.8
const BASE_REFERENCE_AREA = 1280 * 720
const DENSITY_SCALE_MIN = 0.28
const DENSITY_SCALE_MAX = 1.35
const BEAM_WIDTH_SCALE_MIN = 0.75
const BEAM_WIDTH_SCALE_MAX = 1.3

const BASE_SPEED_PPS_MIN = 50
const BASE_SPEED_PPS_RANGE = 64

const BASE_PULSE_SPEED_MIN = 1.2
const BASE_PULSE_SPEED_RANGE = 2.2
const BASE_FLICKER_SPEED_MIN = 0.9
const BASE_FLICKER_SPEED_RANGE = 2.0
const FLICKER_DEPTH_MIN = 0.22
const FLICKER_DEPTH_RANGE = 0.38
const POSTECH_HUES = [210, 228, 248] as const
const BASE_ANCHOR_HEIGHT = 1080
const BASE_BLUR_PX = 16
const MAX_BLUR_PX = 28
const MIN_BLUR_PX = 6

const SLOW_FRAME_MS = 18
const GOOD_FRAME_MS = 16
const DEGRADE_HOLD_SECONDS = 1
const RECOVER_HOLD_SECONDS = 2
const EWMA_ALPHA = 0.12
const DELTA_CLAMP_MS = 100
const PERF_ADAPT_ENABLED = true
const PERFORMANCE_RESTORE_BOOST = 2
const SPEED_SCALE_MIN = 0.78
const SPEED_SCALE_MAX = 1.5
const SCROLL_PAUSE_TIMEOUT_MS = 120

function getCanvasContext2D(
  canvas: HTMLCanvasElement
): CanvasRenderingContext2D | null {
  try {
    const context = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
    })
    if (context) {
      return context
    }
  } catch {
    // 일부 구형 브라우저에서 desynchronized 옵션이 예외를 일으킬 수 있어 fallback 처리
  }

  return canvas.getContext("2d")
}

function resetCanvasTransform(ctx: CanvasRenderingContext2D) {
  if (typeof (ctx as CanvasRenderingContext2D & { resetTransform?: () => void }).resetTransform === "function") {
    ;(ctx as CanvasRenderingContext2D & { resetTransform: () => void }).resetTransform()
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getClampedDpr() {
  if (typeof window === "undefined") return 1
  const dpr = window.devicePixelRatio || 1
  return clamp(dpr, 1, MAX_DPR)
}

function getDensityScale(logicalWidth: number, logicalHeight: number) {
  const safeWidth = Math.max(logicalWidth, 1)
  const safeHeight = Math.max(logicalHeight, 1)
  const baseArea = BASE_REFERENCE_AREA
  const scale = Math.sqrt((safeWidth * safeHeight) / baseArea)
  return clamp(scale, DENSITY_SCALE_MIN, DENSITY_SCALE_MAX)
}

function getMovementScale(logicalHeight: number, densityScale: number) {
  const heightScale = logicalHeight / BASE_ANCHOR_HEIGHT
  const speedScale = Math.sqrt(clamp(heightScale, 0.5, 2.25)) * densityScale
  return clamp(speedScale, SPEED_SCALE_MIN, SPEED_SCALE_MAX)
}

function getRespawnOffset(logicalHeight: number) {
  return Math.round(clamp(logicalHeight * 0.08, 40, 220))
}

function getBeamBlurPx(densityScale: number) {
  return clamp(Math.round(BASE_BLUR_PX * Math.sqrt(densityScale)), MIN_BLUR_PX, MAX_BLUR_PX)
}

function getDensityBeamCount(densityScale: number) {
  const target = Math.round(BASE_BEAM_COUNT * densityScale)
  return clamp(target, MIN_BEAM_COUNT, MAX_BEAM_COUNT)
}

function getScaledBeamWidth(baseWidth: number, densityScale: number) {
  const safeScale = clamp(densityScale, BEAM_WIDTH_SCALE_MIN, BEAM_WIDTH_SCALE_MAX)
  return baseWidth * safeScale
}

function createBeam(
  logicalWidth: number,
  logicalHeight: number,
  densityScale: number
): Beam {
  const hueSeed = POSTECH_HUES[Math.floor(Math.random() * POSTECH_HUES.length)]
  const movementScale = getMovementScale(logicalHeight, densityScale)

  return {
    x: Math.random() * logicalWidth * 1.5 - logicalWidth * 0.25,
    y: Math.random() * logicalHeight * 1.5 - logicalHeight * 0.25,
    width: getScaledBeamWidth(54 + Math.random() * 110, densityScale),
    length: logicalHeight * 2.5,
    angle: -35 + Math.random() * 10,
    speed:
      (BASE_SPEED_PPS_MIN + Math.random() * BASE_SPEED_PPS_RANGE) * movementScale,
    opacity: 0.08 + Math.random() * 0.08,
    hue: hueSeed + (Math.random() * 10 - 5),
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed:
      BASE_PULSE_SPEED_MIN + Math.random() * BASE_PULSE_SPEED_RANGE,
    flicker: Math.random() * Math.PI * 2,
    flickerSpeed:
      BASE_FLICKER_SPEED_MIN + Math.random() * BASE_FLICKER_SPEED_RANGE,
    flickerDepth: FLICKER_DEPTH_MIN + Math.random() * FLICKER_DEPTH_RANGE,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.8 + Math.random() * 1.4,
    swayAmplitude: 8 + Math.random() * 16,
  }
}

function throttle<T extends (...args: unknown[]) => void>(func: T, limit: number): (...args: Parameters<T>) => void {
  let lastTimeout: ReturnType<typeof setTimeout> | undefined
  let lastRan = 0

  return (...args: Parameters<T>) => {
    if (!lastRan) {
      func(...args)
      lastRan = Date.now()
      return
    }

    if (lastTimeout) {
      clearTimeout(lastTimeout)
    }

    lastTimeout = setTimeout(() => {
      if (Date.now() - lastRan >= limit) {
        func(...args)
        lastRan = Date.now()
      }
    }, Math.max(0, limit - (Date.now() - lastRan)))
  }
}

function updateBeamCountInPlace(
  beams: Beam[],
  logicalWidth: number,
  logicalHeight: number,
  densityScale: number,
  desiredCount: number
) {
  if (beams.length < desiredCount) {
    for (let i = beams.length; i < desiredCount; i += 1) {
      beams.push(createBeam(logicalWidth, logicalHeight, densityScale))
    }
    return
  }

  if (beams.length > desiredCount) {
    beams.length = desiredCount
    return
  }
}

export default function BeamsBackground({
  className,
  intensity = "strong",
  showHero = false,
}: AnimatedGradientBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const beamsRef = useRef<Beam[]>([])
  const animationFrameRef = useRef<number>(0)
  const animationActiveRef = useRef<boolean>(true)
  const reducedMotionRef = useRef<boolean>(false)
  const targetBeamCountRef = useRef<number>(BASE_BEAM_COUNT)
  const frameTimeEwmaRef = useRef<number>(GOOD_FRAME_MS)
  const slowFrameAccumRef = useRef<number>(0)
  const restoreWaitRef = useRef<number>(0)
  const animateRef = useRef<((timestamp: number) => void) | null>(null)
  const lastFrameTimeRef = useRef<number>(0)
  const densityScaleRef = useRef<number>(1)
  const reducedMotionQueryRef = useRef<MediaQueryList | null>(null)
  const scrollPauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isScrollPausedRef = useRef<boolean>(false)

  const startAnimation = useCallback(() => {
    if (!animationActiveRef.current && canvasRef.current && animateRef.current) {
      animationActiveRef.current = true
      animateRef.current(performance.now())
    }
  }, [])

  const stopAnimation = useCallback(() => {
    animationActiveRef.current = false
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = 0
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = getCanvasContext2D(canvas)
    if (!ctx) return

    const updateCanvasSize = () => {
      const dpr = getClampedDpr()
      const container = containerRef.current
      const fallbackWidth = window.innerWidth
      const fallbackHeight = window.innerHeight
      const bounds = container?.getBoundingClientRect()
      const logicalWidth = clamp(
        Math.floor(bounds?.width || fallbackWidth),
        1,
        Number.MAX_SAFE_INTEGER
      )
      const logicalHeight = clamp(
        Math.floor(bounds?.height || fallbackHeight),
        1,
        Number.MAX_SAFE_INTEGER
      )
      const densityScale = getDensityScale(logicalWidth, logicalHeight)
      densityScaleRef.current = densityScale
      targetBeamCountRef.current = getDensityBeamCount(densityScale)

      canvas.width = Math.floor(logicalWidth * dpr)
      canvas.height = Math.floor(logicalHeight * dpr)
      canvas.style.width = `${logicalWidth}px`
      canvas.style.height = `${logicalHeight}px`
      canvas.style.filter = `blur(${getBeamBlurPx(densityScale)}px)`

      resetCanvasTransform(ctx)
      ctx.scale(dpr, dpr)

      const desiredCount = reducedMotionRef.current ? 0 : targetBeamCountRef.current
      beamsRef.current.forEach((beam) => {
        beam.length = logicalHeight * 2.5
      })
      updateBeamCountInPlace(
        beamsRef.current,
        logicalWidth,
        logicalHeight,
        densityScale,
        desiredCount
      )
    }

    updateCanvasSize()
    const throttledResize = throttle(updateCanvasSize, 250)
    window.addEventListener("resize", throttledResize)
    window.visualViewport?.addEventListener("resize", throttledResize)

    const motionMediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    reducedMotionQueryRef.current = motionMediaQuery
    reducedMotionRef.current = motionMediaQuery.matches

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches
      if (event.matches) {
        stopAnimation()
        beamsRef.current = []
      } else {
        updateCanvasSize()
        startAnimation()
      }
    }

    if (motionMediaQuery.matches) {
      stopAnimation()
      beamsRef.current = []
    }

    if (typeof motionMediaQuery.addEventListener === "function") {
      motionMediaQuery.addEventListener("change", handleReducedMotionChange)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      motionMediaQuery.addListener(handleReducedMotionChange as any)
    }

    const adjustBeamCount = () => {
      const dpr = getClampedDpr()
      const logicalWidth = canvas.width / dpr
      const logicalHeight = canvas.height / dpr
      const desiredCount = reducedMotionRef.current ? 0 : targetBeamCountRef.current
      updateBeamCountInPlace(
        beamsRef.current,
        logicalWidth,
        logicalHeight,
        densityScaleRef.current,
        desiredCount
      )
    }

    const resetBeam = (
      beam: Beam,
      index: number,
      totalBeams: number,
      logicalWidth: number,
      logicalHeight: number,
      densityScale: number
    ) => {
      const lanes = Math.floor(Math.sqrt(totalBeams / 3))
      const columnCount = Math.max(3, Math.min(6, Math.max(4, lanes)))
      const column = index % columnCount
      const spacing = logicalWidth / columnCount
      beam.y = logicalHeight + getRespawnOffset(logicalHeight)
      beam.x = column * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.5
      beam.width = getScaledBeamWidth(80 + Math.random() * 120, densityScale)
      const movementScale = getMovementScale(logicalHeight, densityScale)
      beam.speed = (BASE_SPEED_PPS_MIN + Math.random() * BASE_SPEED_PPS_RANGE) * movementScale
      const hueSeed = POSTECH_HUES[index % POSTECH_HUES.length]
      beam.hue = hueSeed + (Math.random() * 12 - 6)
      beam.opacity = 0.1 + Math.random() * 0.08
      beam.length = logicalHeight * 2.5
      beam.pulse = Math.random() * Math.PI * 2
      beam.pulseSpeed = BASE_PULSE_SPEED_MIN + Math.random() * BASE_PULSE_SPEED_RANGE
      beam.flicker = Math.random() * Math.PI * 2
      beam.flickerSpeed = BASE_FLICKER_SPEED_MIN + Math.random() * BASE_FLICKER_SPEED_RANGE
      beam.flickerDepth = FLICKER_DEPTH_MIN + Math.random() * FLICKER_DEPTH_RANGE
      beam.angle = -35 + Math.random() * 10
      beam.sway = Math.random() * Math.PI * 2
      beam.swaySpeed = 0.8 + Math.random() * 1.4
      beam.swayAmplitude = 10 + Math.random() * 20
    }

    const drawBeam = (beam: Beam) => {
      const pulseFactor = 0.75 + Math.sin(beam.pulse) * 0.35
      const flickerFactor = 0.15 + Math.sin(beam.flicker) * 0.15
      const colorShift = Math.sin(beam.pulse * 0.5) * 8
      const hue = (beam.hue + colorShift) % 360

      const pulsingOpacity =
        beam.opacity * (pulseFactor + flickerFactor * beam.flickerDepth) * OPACITY_MAP[intensity]
      if (pulsingOpacity <= 0) return
      const finalOpacity = clamp(pulsingOpacity * 1.65, 0, 1)

      ctx.save()
      ctx.translate(beam.x, beam.y)
      ctx.rotate((beam.angle * Math.PI) / 180)
      const maskGradient = ctx.createLinearGradient(0, 0, 0, beam.length)
      maskGradient.addColorStop(0, `hsla(${hue}, 58%, 42%, 0)`)
      maskGradient.addColorStop(0.1, `hsla(${hue}, 56%, 48%, 0.12)`)
      maskGradient.addColorStop(0.28, `hsla(${hue}, 54%, 54%, 0.42)`)
      maskGradient.addColorStop(0.5, `hsla(${hue}, 52%, 60%, 0.72)`)
      maskGradient.addColorStop(0.72, `hsla(${hue}, 54%, 54%, 0.42)`)
      maskGradient.addColorStop(0.9, `hsla(${hue}, 56%, 48%, 0.12)`)
      maskGradient.addColorStop(1, `hsla(${hue}, 58%, 42%, 0)`)
      ctx.fillStyle = maskGradient
      ctx.globalAlpha = finalOpacity
      ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length)
      ctx.restore()
    }

    const applyPerfAdaptation = (frameMs: number) => {
      if (!PERF_ADAPT_ENABLED) return
      const ewma = frameTimeEwmaRef.current
      frameTimeEwmaRef.current = ewma * (1 - EWMA_ALPHA) + frameMs * EWMA_ALPHA

      const desiredCount = targetBeamCountRef.current
      if (frameTimeEwmaRef.current > SLOW_FRAME_MS && desiredCount > MIN_BEAM_COUNT) {
        slowFrameAccumRef.current = clamp(
          slowFrameAccumRef.current + frameMs / 1000,
          0,
          DEGRADE_HOLD_SECONDS + 0.25
        )
        restoreWaitRef.current = 0

        if (slowFrameAccumRef.current >= DEGRADE_HOLD_SECONDS) {
          targetBeamCountRef.current = desiredCount - 1
          slowFrameAccumRef.current = 0
        }
      } else {
        slowFrameAccumRef.current = 0
        const densityCap = getDensityBeamCount(densityScaleRef.current)
        if (desiredCount < densityCap) {
          restoreWaitRef.current = clamp(
            restoreWaitRef.current + frameMs / 1000,
            0,
            RECOVER_HOLD_SECONDS
          )
          if (restoreWaitRef.current >= RECOVER_HOLD_SECONDS) {
            targetBeamCountRef.current = Math.min(
              densityCap,
              desiredCount + PERFORMANCE_RESTORE_BOOST
            )
            restoreWaitRef.current = 0
          }
        } else {
          restoreWaitRef.current = 0
        }
      }

      if (targetBeamCountRef.current !== desiredCount) {
        adjustBeamCount()
      }
    }

    const animate = (timestamp: number) => {
      if (!animationActiveRef.current) return
      if (!canvas || !ctx) return

      if (reducedMotionRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate)
        lastFrameTimeRef.current = timestamp
        return
      }

      const dpr = getClampedDpr()
      const logicalWidth = canvas.width / dpr
      const logicalHeight = canvas.height / dpr
      if (!Number.isFinite(logicalWidth) || !Number.isFinite(logicalHeight)) {
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      const rawFrameMs =
        lastFrameTimeRef.current === 0 ? GOOD_FRAME_MS : timestamp - lastFrameTimeRef.current
      const deltaMs = clamp(rawFrameMs, 0, DELTA_CLAMP_MS)
      const deltaSec = deltaMs / 1000
      applyPerfAdaptation(rawFrameMs)

      const beams = beamsRef.current
      if (beams.length > 0) {
        ctx.clearRect(0, 0, logicalWidth, logicalHeight)

        for (let i = 0; i < beams.length; i += 1) {
          const beam = beams[i]
          beam.y -= beam.speed * deltaSec
          beam.pulse += beam.pulseSpeed * deltaSec
          beam.flicker += beam.flickerSpeed * deltaSec
          beam.sway += beam.swaySpeed * deltaSec
          beam.x += Math.sin(beam.sway) * beam.swayAmplitude * 0.25 * deltaSec

          if (beam.y + beam.length < -getRespawnOffset(logicalHeight)) {
            resetBeam(
              beam,
              i,
              beams.length,
              logicalWidth,
              logicalHeight,
              densityScaleRef.current
            )
          }

          drawBeam(beam)
        }
      }

      lastFrameTimeRef.current = timestamp
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animateRef.current = animate

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAnimation()
      } else {
        lastFrameTimeRef.current = 0
        startAnimation()
      }
    }

    const resizeObserver: ResizeObserver | null =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(throttledResize)
    if (containerRef.current && resizeObserver) {
      resizeObserver.observe(containerRef.current)
    }

    const handleScrollPause = () => {
      if (!isScrollPausedRef.current) {
        isScrollPausedRef.current = true
        stopAnimation()
        document.documentElement.classList.add("scrolling")
      }

      if (scrollPauseTimeoutRef.current) {
        clearTimeout(scrollPauseTimeoutRef.current)
      }

      scrollPauseTimeoutRef.current = setTimeout(() => {
        isScrollPausedRef.current = false
        document.documentElement.classList.remove("scrolling")
        if (!reducedMotionRef.current) {
          startAnimation()
        }
      }, SCROLL_PAUSE_TIMEOUT_MS)
    }

    window.addEventListener("scroll", handleScrollPause, { passive: true })

    document.addEventListener("visibilitychange", handleVisibilityChange)

    if (!reducedMotionRef.current) {
      animationActiveRef.current = true
      lastFrameTimeRef.current = 0
      animate(performance.now())
    } else {
      updateCanvasSize()
      canvas.width = Math.max(1, canvas.width)
      canvas.height = Math.max(1, canvas.height)
      stopAnimation()
    }

    return () => {
      window.removeEventListener("resize", throttledResize)
      window.visualViewport?.removeEventListener("resize", throttledResize)
      const mq = reducedMotionQueryRef.current
      if (mq) {
        if (typeof mq.removeEventListener === "function") {
          mq.removeEventListener("change", handleReducedMotionChange)
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mq.removeListener(handleReducedMotionChange as any)
        }
      }
      resizeObserver?.disconnect()
      if (scrollPauseTimeoutRef.current) {
        clearTimeout(scrollPauseTimeoutRef.current)
      }
      document.documentElement.classList.remove("scrolling")
      window.removeEventListener("scroll", handleScrollPause)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      stopAnimation()
      beamsRef.current = []
    }
  }, [intensity, startAnimation, stopAnimation])
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(37,53,86,0.18),_rgba(5,7,12,0.96)_50%,_rgba(3,4,8,1)_100%)]",
        showHero ? "min-h-screen" : "h-full",
        className
      )}
      ref={containerRef}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="absolute inset-0 beams-overlay" />

      {showHero && (
        <>
          <div className="relative z-10 flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-6 px-4 text-center">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-semibold text-white tracking-tighter animate-in fade-in-0 slide-in-from-bottom-5 duration-700">
                Dong-Ha Shin
              </h1>
              <p className="text-lg md:text-2xl lg:text-3xl text-white/70 tracking-tighter animate-in fade-in-0 slide-in-from-bottom-5 duration-700 delay-200">
                Holography Researcher & Machine Learning Engineer
              </p>
            </div>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </>
      )}
    </div>
  )
}
