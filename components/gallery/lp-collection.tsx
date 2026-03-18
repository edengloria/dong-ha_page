"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Disc3, ExternalLink, Loader2, X, Volume2, VolumeX } from "lucide-react"
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

let globalAudio: HTMLAudioElement | null = null
let currentPlayingId: number | null = null

function stopGlobalAudio() {
  if (globalAudio) {
    globalAudio.pause()
    globalAudio.src = ""
    globalAudio = null
  }
  currentPlayingId = null
}

function LPCard({
  release,
  index, 
  onClick,
  onTrackInfoChange,
  isMobile,
  isActiveOnMobile,
  onMobileActivate,
  prefs,
}: {
  release: DiscogsRelease
  index: number
  onClick: () => void
  onTrackInfoChange?: (info: { trackName: string; artistName: string } | null) => void
  isMobile: boolean
  isActiveOnMobile: boolean
  onMobileActivate: () => void
  prefs: TrackPreferences
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isActiveRef = useRef(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [matchFailed, setMatchFailed] = useState(false)
  
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

        let vol = 0
        const fadeIn = setInterval(() => {
          if (globalAudio === audio && vol < 0.5) {
            vol = Math.min(vol + 0.1, 0.5)
            audio.volume = vol
          } else {
            clearInterval(fadeIn)
          }
        }, 50)
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
      let vol = audio.volume
      const fadeOut = setInterval(() => {
        vol = Math.max(vol - 0.15, 0)
        if (audio === globalAudio) {
          audio.volume = vol
        }
        if (vol <= 0) {
          clearInterval(fadeOut)
          if (audio === globalAudio) {
            stopGlobalAudio()
          }
          setIsPlaying(false)
          onTrackInfoChange?.(null)
        }
      }, 20)
    }
  }, [release.instance_id, onTrackInfoChange])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const tiltX = ((y - centerY) / centerY) * -15
    const tiltY = ((x - centerX) / centerX) * 15

    setTilt({ x: tiltX, y: tiltY })
  }

  const handleMouseLeave = () => {
    if (isMobile) return
    setTilt({ x: 0, y: 0 })
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
    }, 300)
  }

  const handleMobileTap = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!isMobile) return
    event.stopPropagation()

    if (isActiveOnMobile) {
      stopPreview()
    } else {
      onMobileActivate()
      isActiveRef.current = true
      playPreview()
    }
  }, [isMobile, isActiveOnMobile, stopPreview, onMobileActivate, playPreview])

  // Handle deactivation when another card is activated on mobile
  useEffect(() => {
    if (isMobile && !isActiveOnMobile && isActiveRef.current) {
      stopPreview()
    }
  }, [isMobile, isActiveOnMobile, stopPreview])

  useEffect(() => {
    return () => {
      isActiveRef.current = false
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
      }
      if (currentPlayingId === release.instance_id) {
        stopGlobalAudio()
      }
    }
  }, [release.instance_id])

  return (
    <motion.div
      className="group cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
      onClick={isMobile ? handleMobileTap : onClick}
      style={{ 
        perspective: "1000px",
        zIndex: isActive ? 20 : 1,
        position: "relative",
      }}
    >
      <div
        ref={cardRef}
        className="relative aspect-square overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: "preserve-3d",
          transform: isMobile ? "none" : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: isActive ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
        }}
      >
        <div 
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            right: "5%",
            transform: `translateY(-50%) translateX(${isActive ? "60%" : "0%"})`,
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
              <img
                src={release.cover_image}
                alt=""
                className="w-full h-full object-cover"
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
          <img
            src={release.cover_image}
            alt={release.title}
            className="w-full h-full object-cover"
            loading="lazy"
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
        <h4 className="text-foreground text-xs font-medium line-clamp-1">
          {release.title}
        </h4>
        <p className="text-muted-foreground text-[10px] line-clamp-1">
          {release.artist}
        </p>
        <p className="text-postech-red/70 text-[10px]">
          {release.year > 0 ? release.year : "Unknown"}
        </p>
      </div>
    </motion.div>
  )
}

export default function LPCollection({
  releases: initialReleases,
  prefs: initialPrefs,
}: {
  releases: DiscogsRelease[]
  prefs: TrackPreferences
}) {
  const [selectedLP, setSelectedLP] = useState<StaticRelease | null>(null)
  const [nowPlaying, setNowPlaying] = useState<{ trackName: string; artistName: string } | null>(null)
  const [activeMobileLP, setActiveMobileLP] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const isMobile = useIsMobile()

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  const releases = useMemo(() => initialReleases ?? [], [initialReleases])
  const prefs = useMemo(() => initialPrefs ?? {}, [initialPrefs])
  const totalItems = releases.length

  const handleMobileActivate = useCallback((instanceId: number) => {
    setActiveMobileLP((prev) => (prev === instanceId ? null : instanceId))
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
        <AnimatePresence>
          {nowPlaying && (
            <motion.div
              className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] bg-black/90 backdrop-blur-xl rounded-full px-4 py-2 border border-postech-red/30 shadow-lg shadow-postech-red/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-x-8">
        {releases.map((release, index) => (
          <LPCard
            key={release.instance_id || release.id}
            release={release}
            index={index}
            onClick={() => setSelectedLP(release)}
            onTrackInfoChange={(info) => setNowPlaying(info)}
            isMobile={isMobile}
            isActiveOnMobile={activeMobileLP === release.instance_id}
            onMobileActivate={() => handleMobileActivate(release.instance_id)}
            prefs={prefs}
          />
        ))}
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {selectedLP && (
            <motion.div
              className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLP(null)}
            >
              <motion.div
                className="relative bg-background/95 backdrop-blur-xl rounded-2xl max-w-lg w-full overflow-hidden border border-border/50 shadow-2xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10 p-1"
                  onClick={() => setSelectedLP(null)}
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Album Cover */}
                <div className="relative aspect-square w-full">
                  <img
                    src={selectedLP.cover_image}
                    alt={selectedLP.title}
                    className="w-full h-full object-cover"
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
