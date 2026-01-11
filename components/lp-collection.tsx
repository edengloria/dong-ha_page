"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Disc3, ExternalLink, Loader2, X, Volume2, VolumeX } from "lucide-react"
import discogsDataRaw from "@/data/discogs-collection.json"
import prefsRaw from "@/data/track-preferences.json"

type StaticRelease = {
  id: number
  instance_id: number
  title: string
  artist: string
  year: number
  cover_image: string
  tracks: Array<{ position: string; title: string; duration: string }>
}

type DiscogsCollectionData = {
  fetchedAt: string
  releases: StaticRelease[]
}

type TrackPreferences = Record<
  string,
  { selectedTrackIndex: number; selectedTrackTitle: string; customSearchQuery?: string }
>

interface iTunesResult {
  previewUrl?: string
  trackName?: string
  artistName?: string
  collectionName?: string
}

interface PreviewData {
  url: string
  trackName: string
  artistName: string
  albumName: string
}

const discogsData = discogsDataRaw as unknown as DiscogsCollectionData
const prefsData = (prefsRaw as unknown as TrackPreferences) ?? {}

// Cache for iTunes preview data
const previewCache = new Map<string, PreviewData | null>()

// Global audio management
let globalAudio: HTMLAudioElement | null = null
let currentPlayingId: number | null = null

// Stop all audio
function stopGlobalAudio() {
  if (globalAudio) {
    globalAudio.pause()
    globalAudio.src = ""
    globalAudio = null
  }
  currentPlayingId = null
}

// Common Korean artist romanization mappings
const ARTIST_KOREAN_MAP: Record<string, string> = {
  "cho yong-pil": "조용필",
  "cho yongpil": "조용필",
  "cheong tae choon": "정태춘",
  "chung tae chun": "정태춘",
  "kim kwang seok": "김광석",
  "siinkwa chonjang": "시인과 촌장",
  "shin seung hun": "신승훈",
  "lee moon sae": "이문세",
  "lee moon-sae": "이문세",
  "yoo jae ha": "유재하",
  "kim hyun sik": "김현식",
  "deulgukhwa": "들국화",
  "sanullim": "산울림",
  "song chang sik": "송창식",
  "yang hee eun": "양희은",
  "han dae soo": "한대수",
  "kim min ki": "김민기",
  "jeon in kwon": "전인권",
  "bom yeoreum gaeul gyeoul": "봄여름가을겨울",
  "spring summer fall winter": "봄여름가을겨울",
  "light and salt": "빛과소금",
  "bitgwa sogeum": "빛과소금",
  "yoonsang": "윤상",
  "yoon sang": "윤상",
}

// Check if text contains Korean/CJK characters
function containsKorean(text: string): boolean {
  return /[\uAC00-\uD7AF\u4E00-\u9FFF]/.test(text)
}

// Get Korean name for romanized artist
function getKoreanArtistName(romanized: string): string | null {
  const normalized = romanized.toLowerCase().trim()
  return ARTIST_KOREAN_MAP[normalized] || null
}

// Text cleanup utilities
function cleanupText(text: string): string {
  return text
    // Remove content in parentheses and brackets
    .replace(/\s*[\(\[].*?[\)\]]\s*/g, " ")
    // Remove common suffixes
    .replace(/\s*(deluxe|remaster|edition|anniversary|expanded|bonus|disc \d+|cd \d+|vinyl|lp).*$/i, "")
    // Remove feat./ft.
    .replace(/\s*(feat\.?|ft\.?|featuring)\s+.*/i, "")
    // Remove special characters
    .replace(/['"''""]/g, "")
    // Remove extra spaces
    .replace(/\s+/g, " ")
    .trim()
}

// Calculate similarity between two strings (0-1)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()
  
  if (s1 === s2) return 1
  if (s1.includes(s2) || s2.includes(s1)) return 0.8
  
  // Simple word overlap
  const words1 = s1.split(/\s+/)
  const words2 = s2.split(/\s+/)
  const commonWords = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)))
  
  return commonWords.length / Math.max(words1.length, words2.length)
}

// Individual LP Card with 3D tilt effect and music preview
function LPCard({ 
  release, 
  index, 
  onClick,
  onTrackInfoChange,
}: { 
  release: StaticRelease
  index: number
  onClick: () => void
  onTrackInfoChange?: (info: { trackName: string; artistName: string } | null) => void
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

  // Search iTunes with multiple strategies
  const searchItunesPreview = useCallback(async (): Promise<PreviewData | null> => {
    const originalArtist = release.artist || ""
    const originalAlbum = release.title
    const pref = prefsData[String(release.id)]
    const customQuery = (pref?.customSearchQuery ?? "").trim()
    const selectedTitle = (pref?.selectedTrackTitle ?? "").trim()
    const preferredQuery =
      customQuery || `${originalArtist} ${selectedTitle || originalAlbum}`.trim()

    const cacheKey = `${release.id}-${preferredQuery || `${originalArtist}-${originalAlbum}`}`

    // Check cache first
    if (previewCache.has(cacheKey)) {
      return previewCache.get(cacheKey) ?? null
    }

    const cleanArtist = cleanupText(originalArtist)
    const cleanAlbum = cleanupText(originalAlbum)
    
    // Check if we have a Korean mapping for this artist
    const koreanArtist = getKoreanArtistName(originalArtist) || getKoreanArtistName(cleanArtist)
    
    // Check if album has Korean characters
    const albumHasKorean = containsKorean(originalAlbum)

    // Build search strategies
    const searchStrategies: string[] = []
    
    // If admin configured a specific query, try it first
    if (preferredQuery) {
      searchStrategies.push(preferredQuery)
    }

    // If we have a Korean artist name, prioritize it
    if (koreanArtist) {
      searchStrategies.push(`${koreanArtist} ${cleanAlbum}`)
      searchStrategies.push(koreanArtist)
    }
    
    // If album is in Korean, search album first (often more unique)
    if (albumHasKorean) {
      searchStrategies.push(cleanAlbum)
      searchStrategies.push(`${cleanAlbum} ${cleanArtist}`)
    }
    
    // Standard strategies
    searchStrategies.push(`${cleanArtist} ${cleanAlbum}`)
    searchStrategies.push(`${originalArtist} ${originalAlbum}`)
    searchStrategies.push(cleanArtist)

    setIsLoadingPreview(true)

    try {
      for (const query of searchStrategies) {
        // Check if still active before each fetch
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

          // If user provided a custom query, accept the first preview result directly.
          // This intentionally bypasses album/artist similarity scoring.
          if (customQuery && query === customQuery) {
            const first = results.find((r) => Boolean(r.previewUrl))
            if (first?.previewUrl) {
              const previewData: PreviewData = {
                url: first.previewUrl,
                trackName: first.trackName || "Unknown Track",
                artistName: first.artistName || originalArtist,
                albumName: first.collectionName || originalAlbum,
              }
              previewCache.set(cacheKey, previewData)
              return previewData
            }
          }

          // Find the best match
          let bestMatch: { result: iTunesResult; score: number } | null = null
          
          for (const result of results) {
            if (!result.previewUrl) continue

            const resultArtist = result.artistName || ""
            const resultAlbum = result.collectionName || ""
            const cleanResultArtist = cleanupText(resultArtist)
            const cleanResultAlbum = cleanupText(resultAlbum)

            // Calculate similarity scores
            let artistSim = calculateSimilarity(cleanArtist, cleanResultArtist)
            
            // Also check against Korean artist name if available
            if (koreanArtist) {
              const koreanArtistSim = calculateSimilarity(koreanArtist, cleanResultArtist)
              artistSim = Math.max(artistSim, koreanArtistSim)
            }
            
            const albumSim = calculateSimilarity(cleanAlbum, cleanResultAlbum)
            
            // Combined score
            const score = (artistSim * 0.5) + (albumSim * 0.5)
            
            // Accept if:
            // 1. Artist matches somewhat (>0.2), OR
            // 2. Album matches well (>0.4), OR
            // 3. Album has Korean and album matches (>0.3) - for Korean music search
            const isValid = artistSim >= 0.2 || albumSim >= 0.4 || (albumHasKorean && albumSim >= 0.3)
            
            if (isValid && score > (bestMatch?.score ?? 0)) {
              bestMatch = { result, score }
            }
          }
          
          // Use best match if found and score is reasonable
          // Lower threshold for Korean albums (0.15) vs others (0.2)
          const minScore = albumHasKorean ? 0.15 : 0.2
          if (bestMatch && bestMatch.score >= minScore) {
            const previewData: PreviewData = {
              url: bestMatch.result.previewUrl!,
              trackName: bestMatch.result.trackName || "Unknown Track",
              artistName: bestMatch.result.artistName || originalArtist,
              albumName: bestMatch.result.collectionName || originalAlbum,
            }
            previewCache.set(cacheKey, previewData)
            return previewData
          }
        } catch {
          clearTimeout(timeoutId)
          // Continue to next strategy on error
          continue
        }
      }

      // No match found
      previewCache.set(cacheKey, null)
      return null
    } catch (error) {
      console.error("iTunes search failed:", error)
      return null
    } finally {
      setIsLoadingPreview(false)
    }
  }, [release])

  // Play preview
  const playPreview = useCallback(async () => {
    // Stop any currently playing audio first
    stopGlobalAudio()

    // Check if still active
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

    // Create new audio
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
        
        // Fade in
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

  // Stop preview
  const stopPreview = useCallback(() => {
    isActiveRef.current = false
    
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    
    if (currentPlayingId === release.instance_id && globalAudio) {
      // Quick fade out
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
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    // Calculate tilt (max 15 degrees)
    const tiltX = ((y - centerY) / centerY) * -15
    const tiltY = ((x - centerX) / centerX) * 15
    
    setTilt({ x: tiltX, y: tiltY })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
    setIsHovered(false)
    stopPreview()
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    isActiveRef.current = true
    
    // Clear any existing timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
    }
    
    // Delay before playing to prevent rapid hover triggering
    hoverTimerRef.current = setTimeout(() => {
      if (isActiveRef.current) {
        playPreview()
      }
    }, 300)
  }
  
  // Cleanup on unmount
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
      onClick={onClick}
      style={{ 
        perspective: "1000px",
        zIndex: isHovered ? 20 : 1,
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
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: isHovered ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
        }}
      >
        {/* Vinyl Record Effect - Behind the cover but above neighbors */}
        <div 
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            right: "5%",
            transform: `translateY(-50%) translateX(${isHovered ? "60%" : "0%"})`,
            width: "90%",
            aspectRatio: "1",
            transition: "transform 0.5s ease-out",
            zIndex: isHovered ? 5 : 0,
          }}
        >
          <div 
            className="w-full h-full rounded-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700 shadow-xl"
            style={{
              animation: isHovered ? "spin 3s linear infinite" : "none",
            }}
          >
            {/* Vinyl grooves */}
            <div className="absolute inset-[8%] rounded-full border border-zinc-700/30" />
            <div className="absolute inset-[15%] rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
            <div className="absolute inset-[20%] rounded-full border border-zinc-700/20" />
            <div className="absolute inset-[25%] rounded-full border border-zinc-700/30" />
            <div className="absolute inset-[30%] rounded-full border border-zinc-700/20" />
            
            {/* Center label with album art */}
            <div className="absolute inset-[35%] rounded-full overflow-hidden border-2 border-zinc-600 shadow-inner">
              <img
                src={release.cover_image}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Center hole */}
            <div className="absolute inset-[47%] rounded-full bg-zinc-900 border border-zinc-700" />
          </div>
        </div>

        {/* Album Cover - On top */}
        <div 
          className="relative w-full h-full rounded-lg overflow-hidden bg-background/20 border border-border/30 shadow-lg transition-all duration-300"
          style={{ 
            zIndex: 10,
            boxShadow: isHovered 
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.3)" 
              : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <img
            src={release.cover_image}
            alt={release.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Music playing indicator */}
          {isHovered && (
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 max-w-[85%]">
                {isLoadingPreview ? (
                  <>
                    <Loader2 className="h-3 w-3 text-white animate-spin flex-shrink-0" />
                    <span className="text-[10px] text-white/70 truncate">Searching...</span>
                  </>
                ) : isPlaying && previewData ? (
                  <>
                    <Volume2 className="h-3 w-3 text-green-400 flex-shrink-0" />
                    <div className="flex items-end gap-0.5 h-3 flex-shrink-0">
                      <span className="w-0.5 bg-green-400 rounded-full" style={{ animation: 'musicBar 0.4s ease-in-out infinite', animationDelay: '0ms' }} />
                      <span className="w-0.5 bg-green-400 rounded-full" style={{ animation: 'musicBar 0.4s ease-in-out infinite', animationDelay: '0.15s' }} />
                      <span className="w-0.5 bg-green-400 rounded-full" style={{ animation: 'musicBar 0.4s ease-in-out infinite', animationDelay: '0.3s' }} />
                    </div>
                    <span className="text-[10px] text-green-400 truncate ml-1">{previewData.trackName}</span>
                  </>
                ) : matchFailed ? (
                  <>
                    <VolumeX className="h-3 w-3 text-zinc-400 flex-shrink-0" />
                    <span className="text-[10px] text-zinc-400 truncate">No preview</span>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info below cover */}
      <div className="mt-2 px-1">
        <h4 className="text-foreground text-xs font-medium line-clamp-1">
          {release.title}
        </h4>
        <p className="text-muted-foreground text-[10px] line-clamp-1">
          {release.artist}
        </p>
        <p className="text-indigo-400/70 text-[10px]">
          {release.year > 0 ? release.year : "Unknown"}
        </p>
      </div>
    </motion.div>
  )
}

export default function LPCollection() {
  const [selectedLP, setSelectedLP] = useState<StaticRelease | null>(null)
  const [nowPlaying, setNowPlaying] = useState<{ trackName: string; artistName: string } | null>(null)

  const releases = useMemo(() => discogsData.releases ?? [], [])
  const totalItems = releases.length

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Disc3 className="h-5 w-5 text-indigo-400" />
          <span className="text-sm text-muted-foreground">
            {totalItems} records in collection
          </span>
        </div>
        <a
          href={`https://www.discogs.com/user/edengloria/collection`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
        >
          View on Discogs
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Now Playing Bar */}
      <AnimatePresence>
        {nowPlaying && (
          <motion.div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-black/90 backdrop-blur-xl rounded-full px-4 py-2 border border-indigo-500/30 shadow-lg shadow-indigo-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Volume2 className="h-4 w-4 text-green-400" />
                <div className="flex items-end gap-0.5 h-4">
                  <span className="w-0.5 bg-green-400 rounded-full" style={{ animation: 'musicBar 0.4s ease-in-out infinite', animationDelay: '0ms' }} />
                  <span className="w-0.5 bg-green-400 rounded-full" style={{ animation: 'musicBar 0.4s ease-in-out infinite', animationDelay: '0.15s' }} />
                  <span className="w-0.5 bg-green-400 rounded-full" style={{ animation: 'musicBar 0.4s ease-in-out infinite', animationDelay: '0.3s' }} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-sm font-medium truncate max-w-[200px]">{nowPlaying.trackName}</span>
                <span className="text-white/60 text-xs truncate max-w-[200px]">{nowPlaying.artistName}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LP Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-x-8">
        {releases.map((release, index) => (
          <LPCard
            key={release.instance_id || release.id}
            release={release}
            index={index}
            onClick={() => setSelectedLP(release)}
            onTrackInfoChange={(info) => setNowPlaying(info)}
          />
        ))}
      </div>

      {/* LP Detail Modal */}
      <AnimatePresence>
        {selectedLP && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
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
                <p className="text-indigo-400 text-sm mb-3">
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
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg transition-colors text-sm font-medium"
                >
                  View on Discogs
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
