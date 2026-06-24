"use client"

import type React from "react"
import { memo, useState, useEffect, useRef, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { Disc3, ExternalLink, Loader2, X, Volume2, VolumeX } from "lucide-react"
import Image from "next/image"
import { useIsMobile } from "@/hooks/use-mobile"
import type { DiscogsRelease, TrackPreferences } from "@/lib/discogs"
import {
  createPreviewSearchPlan,
  findBestPreviewMatch,
  type PreviewData,
  resolvePreferredPreviewQuery,
} from "@/lib/music-preview"

interface iTunesResult {
  previewUrl?: string
  trackName?: string
  artistName?: string
  collectionName?: string
}

const previewCache = new Map<string, PreviewData | null>()
const PREVIEW_VOLUME_MAX = 0.5
const PREVIEW_FADE_DURATION_MS = 180
const PREVIEW_HOVER_DELAY_MS = 300
const TILT_MAX_DEGREES = 15
const TILT_RESET_TRANSFORM = "perspective(800px) rotateY(0deg) rotateX(0deg)"

let globalAudio: HTMLAudioElement | null = null
let currentPlayingId: number | null = null

function getTiltTransform(clientX: number, clientY: number, rect: DOMRect) {
  const x = clientX - rect.left
  const y = clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const rawTiltX = ((y - centerY) / centerY) * -TILT_MAX_DEGREES
  const rawTiltY = ((x - centerX) / centerX) * TILT_MAX_DEGREES
  const tiltX = Math.round(rawTiltX * 10) / 10
  const tiltY = Math.round(rawTiltY * 10) / 10

  return `perspective(800px) rotateY(${tiltY}deg) rotateX(${tiltX}deg)`
}

function stopGlobalAudio() {
  if (globalAudio) {
    globalAudio.pause()
    globalAudio.src = ""
    globalAudio = null
  }
  currentPlayingId = null
}

const LPCard = memo(function LPCard({
  release,
  index, 
  onOpenById,
  onTrackInfoChange,
  isMobile,
  isActiveOnMobile,
  onMobileActivate,
  prefs,
}: {
  release: DiscogsRelease
  index: number
  onOpenById: (instanceId: number) => void
  onTrackInfoChange?: (info: { trackName: string; artistName: string } | null) => void
  isMobile: boolean
  isActiveOnMobile: boolean
  onMobileActivate: (instanceId: number) => void
  prefs: TrackPreferences
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isActiveRef = useRef(false)
  const audioFadeRef = useRef<number>(0)
  const isMountedRef = useRef(true)
  const tiltTransformRef = useRef(TILT_RESET_TRANSFORM)
  const [isHovered, setIsHovered] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [matchFailed, setMatchFailed] = useState(false)
  const coverImage = release.local_cover_image || release.cover_image || "/placeholder.svg"

  // Combined active state: hover on desktop, tap toggle on mobile
  const isActive = isMobile ? isActiveOnMobile : isHovered

  const searchItunesPreview = useCallback(async (): Promise<PreviewData | null> => {
    const originalArtist = release.artist || ""
    const originalAlbum = release.title
    const { customQuery, preferredQuery } = resolvePreferredPreviewQuery({
      album: originalAlbum,
      artist: originalArtist,
      prefs,
      releaseId: release.id,
    })
    const cacheKey = `${release.id}-${preferredQuery || `${originalArtist}-${originalAlbum}`}`

    if (previewCache.has(cacheKey)) {
      return previewCache.get(cacheKey) ?? null
    }

    const plan = createPreviewSearchPlan({
      album: originalAlbum,
      artist: originalArtist,
      customQuery,
      preferredQuery,
    })

    setIsLoadingPreview(true)

    try {
      for (const query of plan.searchStrategies) {
        if (!isActiveRef.current) return null

        const searchQuery = encodeURIComponent(query)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        try {
          const response = await fetch(
            `https://itunes.apple.com/search?term=${searchQuery}&entity=song&limit=5&country=kr`,
            { signal: controller.signal }
          )
          clearTimeout(timeoutId)

          if (!response.ok) continue

          const data = await response.json()
          const results: iTunesResult[] = data.results || []
          const previewData = findBestPreviewMatch(results, plan)
          if (previewData) {
            previewCache.set(cacheKey, previewData)
            return previewData
          }
        } catch {
          clearTimeout(timeoutId)
          continue
        }
      }

      previewCache.set(cacheKey, null)
      return null
    } catch (error) {
      console.error("iTunes search failed:", error)
      return null
    } finally {
      setIsLoadingPreview(false)
    }
  }, [prefs, release])

  const playPreview = useCallback(async () => {
    stopGlobalAudio()

    if (!isActiveRef.current) return

    let data = previewData
    if (!data && !matchFailed) {
      data = await searchItunesPreview()
      if (!isActiveRef.current) return // Check again after async
      
      if (data) {
        setPreviewData(data)
      } else {
        setMatchFailed(true)
        return
      }
    }

    if (!data || !isActiveRef.current) return

    const audio = new Audio(data.url)
    globalAudio = audio
    currentPlayingId = release.instance_id
    
    audio.volume = 0
    
    audio.oncanplaythrough = () => {
      if (!isActiveRef.current || globalAudio !== audio) {
        audio.pause()
        return
      }
      
      audio.play().then(() => {
        if (!isActiveRef.current || globalAudio !== audio) {
          audio.pause()
          return
        }

        setIsPlaying(true)
        onTrackInfoChange?.({ trackName: data!.trackName, artistName: data!.artistName })

        if (audioFadeRef.current) {
          cancelAnimationFrame(audioFadeRef.current)
        }
        const fadeInStart = performance.now()
        const fadeInStep = (frameTime: number) => {
          const elapsed = frameTime - fadeInStart
          const ratio = elapsed / PREVIEW_FADE_DURATION_MS
          const clamped = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio
          if (globalAudio === audio) {
            audio.volume = clamped * PREVIEW_VOLUME_MAX
          }
          if (clamped < 1 && globalAudio === audio) {
            audioFadeRef.current = requestAnimationFrame(fadeInStep)
          }
        }
        audioFadeRef.current = requestAnimationFrame(fadeInStep)
      }).catch(() => {
        setIsPlaying(false)
      })
    }

    audio.onended = () => {
      if (globalAudio === audio) {
        setIsPlaying(false)
        currentPlayingId = null
        globalAudio = null
        onTrackInfoChange?.(null)
      }
    }

    audio.onerror = () => {
      if (globalAudio === audio) {
        setIsPlaying(false)
        setMatchFailed(true)
        currentPlayingId = null
        globalAudio = null
      }
    }

    audio.load()
  }, [previewData, matchFailed, searchItunesPreview, release.instance_id, onTrackInfoChange])

  const stopPreview = useCallback(() => {
    isActiveRef.current = false

    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }

    if (currentPlayingId === release.instance_id && globalAudio) {
      const audio = globalAudio
      if (audioFadeRef.current) {
        cancelAnimationFrame(audioFadeRef.current)
      }
      const fadeOutStart = performance.now()
      const initialVolume = audio.volume
      const fadeOutStep = (frameTime: number) => {
        const elapsed = frameTime - fadeOutStart
        const ratio = elapsed / PREVIEW_FADE_DURATION_MS
        const clamped = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio
        const volume = (1 - clamped) * initialVolume
        if (audio === globalAudio) {
          audio.volume = volume
        }
        if (clamped < 1 && audio === globalAudio) {
          audioFadeRef.current = requestAnimationFrame(fadeOutStep)
        } else if (audio === globalAudio) {
          stopGlobalAudio()
          setIsPlaying(false)
          onTrackInfoChange?.(null)
        }
      }
      audioFadeRef.current = requestAnimationFrame(fadeOutStep)
    }
  }, [release.instance_id, onTrackInfoChange])

  const handleDesktopClick = useCallback(() => {
    onOpenById(release.instance_id)
  }, [onOpenById, release.instance_id])

  const updateTilt = (clientX: number, clientY: number) => {
    if (isMobile || !cardRef.current) return
    tiltTransformRef.current = getTiltTransform(clientX, clientY, cardRef.current.getBoundingClientRect())
    cardRef.current.style.transform = tiltTransformRef.current
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    updateTilt(event.clientX, event.clientY)
  }

  const reapplyTiltAfterHoverStart = (clientX: number, clientY: number) => {
    if (!cardRef.current) return
    cardRef.current.style.transform = TILT_RESET_TRANSFORM
    cardRef.current.getBoundingClientRect()
    updateTilt(clientX, clientY)
  }

  const handleMouseLeave = () => {
    if (isMobile) return
    if (cardRef.current) {
      tiltTransformRef.current = TILT_RESET_TRANSFORM
      cardRef.current.style.transform = tiltTransformRef.current
    }
    setIsHovered(false)
    stopPreview()
  }

  const handleMouseEnter = () => {
    if (isMobile) return
    setIsHovered(true)
    isActiveRef.current = true

    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
    }

    hoverTimerRef.current = setTimeout(() => {
      if (isActiveRef.current) {
        playPreview()
      }
    }, PREVIEW_HOVER_DELAY_MS)
  }

  const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    const { clientX, clientY } = event
    handleMouseEnter()
    requestAnimationFrame(() => updateTilt(clientX, clientY))
    setTimeout(() => reapplyTiltAfterHoverStart(clientX, clientY), 40)
  }

  const handleMobileTap = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!isMobile) return
    event.stopPropagation()

    if (isActiveOnMobile) {
      stopPreview()
    } else {
      onMobileActivate(release.instance_id)
      isActiveRef.current = true
      playPreview()
    }
  }, [isMobile, isActiveOnMobile, onMobileActivate, playPreview, release.instance_id, stopPreview])

  // Handle deactivation when another card is activated on mobile
  useEffect(() => {
    if (isMobile && !isActiveOnMobile && isActiveRef.current) {
      stopPreview()
    }
  }, [isMobile, isActiveOnMobile, stopPreview])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      isActiveRef.current = false
      if (audioFadeRef.current) {
        cancelAnimationFrame(audioFadeRef.current)
      }
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
      }
      if (currentPlayingId === release.instance_id) {
        stopGlobalAudio()
      }
    }
  }, [release.instance_id])

  return (
    <div
      className="group cursor-pointer animate-in fade-in-0 slide-in-from-bottom-3 duration-500"
      onClick={isMobile ? handleMobileTap : handleDesktopClick}
      style={{ 
        animationDelay: `${Math.min(index * 30, 600)}ms`,
        perspective: "1000px",
        zIndex: isActive ? 20 : 1,
        position: "relative",
        willChange: "transform",
      }}
      >
      <div
        ref={cardRef}
        className="relative aspect-square overflow-visible"
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handleMouseLeave}
        style={{
          transformStyle: "preserve-3d",
          transform: isMobile ? "none" : tiltTransformRef.current,
          transition: isActive ? "none" : "transform 0.5s ease-out",
          willChange: "transform",
        }}
        >
          <div 
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            right: "5%",
            transform: `translateY(-50%) translateX(${isActive ? "62%" : "0%"})`,
            width: "90%",
            aspectRatio: "1",
            transition: "transform 0.5s ease-out",
            zIndex: isActive ? 5 : 0,
          }}
        >
          <div 
            className="w-full h-full rounded-full bg-gradient-to-br from-[#2F3134] via-[#26292C] to-[#2F3134] border border-postech-silver/45 shadow-xl"
            style={{
              animation: isActive ? "spin 3s linear infinite" : "none",
            }}
          >
            <div className="absolute inset-[8%] rounded-full border border-postech-silver/30" />
            <div className="absolute inset-[15%] rounded-full bg-gradient-to-br from-[#242629] to-[#2F3134]" />
            <div className="absolute inset-[20%] rounded-full border border-postech-silver/20" />
            <div className="absolute inset-[25%] rounded-full border border-postech-silver/30" />
            <div className="absolute inset-[30%] rounded-full border border-postech-silver/20" />

            <div className="absolute inset-[35%] rounded-full overflow-hidden border-2 border-postech-silver/30 shadow-inner">
              <Image
                src={coverImage}
                alt=""
                fill
                className="object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="absolute inset-[47%] rounded-full bg-[#111417] border border-postech-silver/30" />
          </div>
        </div>

        <div 
          className="relative w-full h-full rounded-lg overflow-hidden bg-background/20 border border-border/30 shadow-lg transition-all duration-300"
          style={{ 
            zIndex: 10,
            boxShadow: isActive 
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(166, 25, 85, 0.3)" 
              : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Image
            src={coverImage}
            alt={release.title}
            fill
            className="object-cover"
            loading="lazy"
            sizes="(max-width: 768px) 50vw, 260px"
            decoding="async"
          />

          {isActive && (
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 max-w-[85%]">
                {isLoadingPreview ? (
                  <>
                    <Loader2 className="h-3 w-3 text-white animate-spin flex-shrink-0" />
                    <span className="text-[10px] text-white/70 truncate">Searching...</span>
                  </>
                ) : isPlaying && previewData ? (
                  <>
                    <Volume2 className="h-3 w-3 text-postech-orange flex-shrink-0" />
                    <div className="flex items-end gap-0.5 h-3 flex-shrink-0">
                      <span className="w-0.5 bg-postech-orange rounded-full" style={{ animation: 'musicBar 0.4s ease-in-out infinite', animationDelay: '0ms' }} />
                      <span className="w-0.5 bg-postech-orange rounded-full" style={{ animation: 'musicBar 0.4s ease-in-out infinite', animationDelay: '0.15s' }} />
                      <span className="w-0.5 bg-postech-orange rounded-full" style={{ animation: 'musicBar 0.4s ease-in-out infinite', animationDelay: '0.3s' }} />
                    </div>
                    <span className="text-[10px] text-postech-gold truncate ml-1">{previewData.trackName}</span>
                  </>
                ) : matchFailed ? (
                  <>
                    <VolumeX className="h-3 w-3 text-postech-silver/70 flex-shrink-0" />
                    <span className="text-[10px] text-postech-silver/70 truncate">No preview</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3 w-3 text-white/70 flex-shrink-0" />
                    <span className="text-[10px] text-white/70 truncate">Tap to play</span>
                  </>
                )}
              </div>
            </div>
          )}

          {isMobile && !isActive && index < 2 && (
            <div className="absolute bottom-2 left-2 right-2">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                <Volume2 className="h-3 w-3 text-white/50 flex-shrink-0" />
                <span className="text-[10px] text-white/50 truncate">Tap to play</span>
              </div>
            </div>
          )}
        </div>
      </div>

        <div className="mt-2 px-1">
        <p className="text-foreground text-xs font-medium line-clamp-1">
          {release.title}
        </p>
        <p className="text-muted-foreground text-[10px] line-clamp-1">
          {release.artist}
        </p>
        <p className="text-postech-red/70 text-[10px]">
          {release.year > 0 ? release.year : "Unknown"}
        </p>
        </div>
    </div>
  )
})

export default function LPCollection({
  releases: initialReleases,
  prefs: initialPrefs,
}: {
  releases: DiscogsRelease[]
  prefs: TrackPreferences
}) {
  const [selectedLP, setSelectedLP] = useState<DiscogsRelease | null>(null)
  const [nowPlaying, setNowPlaying] = useState<{ trackName: string; artistName: string } | null>(null)
  const [activeMobileLP, setActiveMobileLP] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const isMobile = useIsMobile()
  const selectedCoverImage =
    selectedLP?.local_cover_image || selectedLP?.cover_image || "/placeholder.svg"

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  const releases = useMemo(() => initialReleases ?? [], [initialReleases])
  const prefs = useMemo(() => initialPrefs ?? {}, [initialPrefs])
  const totalItems = releases.length
  const releaseByInstanceId = useMemo(() => {
    const map = new Map<number, DiscogsRelease>()
    releases.forEach((release) => {
      map.set(release.instance_id, release)
    })
    return map
  }, [releases])

  const handleMobileActivate = useCallback((instanceId: number) => {
    setActiveMobileLP((prev) => (prev === instanceId ? null : instanceId))
  }, [])

  const handleCardSelect = useCallback((instanceId: number) => {
    const release = releaseByInstanceId.get(instanceId)
    if (release) {
      setSelectedLP(release)
    }
  }, [releaseByInstanceId])

  const handleTrackInfoChange = useCallback((info: { trackName: string; artistName: string } | null) => {
    setNowPlaying(info)
  }, [])

  const closeSelectedLP = useCallback(() => {
    setSelectedLP(null)
  }, [])

  const stopModalProp = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
  }, [])

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Disc3 className="h-5 w-5 text-postech-red" />
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              {totalItems} records in collection
            </span>
            <span className="text-xs text-muted-foreground/60">
              {isMobile 
                ? "Tap any album to play a preview!"
                : "This is my actual vinyl collection. Feel free to visit my place if you want to listen!"}
            </span>
          </div>
        </div>
        <a
          href={`https://www.discogs.com/user/edengloria/collection`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-postech-red hover:text-postech-orange flex items-center gap-1 transition-colors"
        >
          View on Discogs
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

          {mounted && createPortal(
        <div
          className={`fixed bottom-4 left-1/2 z-[9998] -translate-x-1/2 bg-black/90 backdrop-blur-xl rounded-full px-4 py-2 border border-postech-red/30 shadow-lg shadow-postech-red/20 transition-all duration-200 ${
            nowPlaying
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "translate-y-2 opacity-0 pointer-events-none"
          }`}
        >
          {nowPlaying ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Volume2 className="h-4 w-4 text-postech-orange" />
                <div className="flex items-end gap-0.5 h-4">
                  <span className="w-0.5 bg-postech-orange rounded-full" style={{ animation: 'musicBar 0.4s ease-in-out infinite', animationDelay: '0ms' }} />
                  <span className="w-0.5 bg-postech-orange rounded-full" style={{ animation: 'musicBar 0.4s ease-in-out infinite', animationDelay: '0.15s' }} />
                  <span className="w-0.5 bg-postech-orange rounded-full" style={{ animation: 'musicBar 0.4s ease-in-out infinite', animationDelay: '0.3s' }} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-sm font-medium truncate max-w-[200px]">{nowPlaying.trackName}</span>
                <span className="text-white/60 text-xs truncate max-w-[200px]">{nowPlaying.artistName}</span>
              </div>
            </div>
          ) : null}
        </div>,
        document.body
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-x-8">
        {releases.map((release, index) => (
        <LPCard
            key={release.instance_id || release.id}
            release={release}
            index={index}
            onOpenById={handleCardSelect}
            onTrackInfoChange={handleTrackInfoChange}
            isMobile={isMobile}
            isActiveOnMobile={activeMobileLP === release.instance_id}
            onMobileActivate={handleMobileActivate}
            prefs={prefs}
          />
        ))}
      </div>

      {mounted && selectedLP && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 animate-in fade-in-0 duration-200"
          onClick={closeSelectedLP}
        >
          <div
            className="relative bg-background/95 backdrop-blur-xl rounded-2xl max-w-lg w-full overflow-hidden border border-border/50 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={stopModalProp}
          >
                {/* Close Button */}
                <button
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10 p-1"
                  onClick={closeSelectedLP}
                  aria-label="Close album details"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Album Cover */}
                <div className="relative aspect-square w-full">
                  <Image
                    src={selectedCoverImage}
                    alt={selectedLP.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 90vw, 600px"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                  />
                </div>

                {/* Album Info */}
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-foreground mb-1">
                    {selectedLP.title}
                  </h3>
                  <p className="text-postech-red text-sm mb-3">
                    {selectedLP.artist}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Year</span>
                      <span className="text-foreground">
                        {selectedLP.year > 0 ? selectedLP.year : "Unknown"}
                      </span>
                    </div>
                  </div>

                  {/* Discogs Link */}
                  <a
                    href={`https://www.discogs.com/release/${selectedLP.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-postech-red hover:bg-postech-orange text-white py-2.5 rounded-lg transition-colors text-sm font-medium"
                  >
                    View on Discogs
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
