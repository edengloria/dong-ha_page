"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { ExternalLink, Loader2, Music2, Save, Shield } from "lucide-react"

import discogsDataRaw from "@/data/discogs-collection.json"
import prefsRaw from "@/data/track-preferences.json"
import { withBasePath } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

type DiscogsCollectionData = {
  fetchedAt: string
  releases: Array<{
    id: number
    instance_id: number
    title: string
    artist: string
    year: number
    cover_image: string
    tracks: Array<{ position: string; title: string; duration: string }>
  }>
}

type TrackPreferences = Record<
  string,
  {
    selectedTrackIndex: number
    selectedTrackTitle: string
    customSearchQuery?: string
  }
>

type ITunesResult = {
  trackName?: string
  artistName?: string
  collectionName?: string
  previewUrl?: string
  trackViewUrl?: string
}

type SavePreferencesResponse = { ok: boolean; error?: string }

const discogsData = discogsDataRaw as unknown as DiscogsCollectionData
const initialPrefs = (prefsRaw as unknown as TrackPreferences) ?? {}

// Common Korean artist romanization mappings (same as lp-collection.tsx)
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

// Text cleanup utilities (same as lp-collection.tsx)
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

export default function DiscogsAdminPage() {
  const [password, setPassword] = useState("")
  const [authed, setAuthed] = useState(false)

  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null)
  const [prefs, setPrefs] = useState<TrackPreferences>(initialPrefs)

  const selectedRelease = useMemo(() => {
    if (selectedReleaseId == null) return null
    return discogsData.releases.find((r) => r.id === selectedReleaseId) ?? null
  }, [selectedReleaseId])

  const prefKey = selectedRelease ? String(selectedRelease.id) : ""
  const currentPref = prefKey ? prefs[prefKey] : undefined

  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(0)
  const [customSearchQuery, setCustomSearchQuery] = useState<string>("")

  const [isSaving, setIsSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewQuery, setPreviewQuery] = useState<string>("")
  const [previewResults, setPreviewResults] = useState<ITunesResult[] | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  useEffect(() => {
    const v = window.localStorage.getItem("adminAuthed")
    if (v === "1") setAuthed(true)
  }, [])

  useEffect(() => {
    if (!selectedRelease) return

    const pref = prefs[String(selectedRelease.id)]
    if (selectedRelease.tracks.length === 0) {
      setSelectedTrackIndex(-1)
    } else {
      const idx = pref?.selectedTrackIndex ?? 0
      setSelectedTrackIndex(
        Math.max(0, Math.min(idx, Math.max(0, selectedRelease.tracks.length - 1)))
      )
    }
    setCustomSearchQuery(pref?.customSearchQuery ?? "")
    setPreviewResults(null)
    setPreviewError(null)
    setPreviewQuery("")
  }, [selectedReleaseId, selectedRelease, prefs])

  const handleLogin = () => {
    const expected = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? ""
    if (!expected) {
      // If not set, allow local-only access (convenience).
      setAuthed(true)
      window.localStorage.setItem("adminAuthed", "1")
      return
    }

    if (password === expected) {
      setAuthed(true)
      window.localStorage.setItem("adminAuthed", "1")
      setPassword("")
    } else {
      setSaveMsg("Wrong password.")
    }
  }

  const effectiveSelectedTrackTitle = useMemo(() => {
    if (!selectedRelease) return ""
    if (selectedRelease.tracks.length === 0) return selectedRelease.title
    return selectedRelease.tracks[selectedTrackIndex]?.title ?? ""
  }, [selectedRelease, selectedTrackIndex])

  const runPreview = async () => {
    if (!selectedRelease) return

    const originalArtist = selectedRelease.artist || ""
    const originalAlbum = selectedRelease.title
    const customQuery = (customSearchQuery || "").trim()
    const preferredQuery =
      customQuery || `${originalArtist} ${effectiveSelectedTrackTitle}`.trim()

    if (!preferredQuery) return

    setIsPreviewing(true)
    setPreviewError(null)
    setPreviewResults(null)
    setPreviewQuery(preferredQuery)

    try {
      // If user provided a custom query, mirror LPCollection behavior:
      // accept the first preview result directly (no album/artist scoring).
      if (customQuery) {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(customQuery)}&entity=song&limit=5&country=kr`
        )
        if (!res.ok) throw new Error(`iTunes search failed: ${res.status}`)
        const data = (await res.json()) as { results?: ITunesResult[] }
        const results = (data.results ?? []).filter((r) => Boolean(r.previewUrl))
        setPreviewResults(results.length > 0 ? results : null)
        return
      }

      const cleanArtist = cleanupText(originalArtist)
      const cleanAlbum = cleanupText(originalAlbum)
      
      // Check if we have a Korean mapping for this artist
      const koreanArtist = getKoreanArtistName(originalArtist) || getKoreanArtistName(cleanArtist)
      
      // Check if album has Korean characters
      const albumHasKorean = containsKorean(originalAlbum)

      // Build search strategies (same as lp-collection.tsx)
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

      // Try each strategy and find best match
      let allResults: ITunesResult[] = []
      let bestMatch: { result: ITunesResult; score: number } | null = null

      for (const query of searchStrategies) {
        try {
          const res = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5&country=kr`
          )
          if (!res.ok) continue
          
          const data = (await res.json()) as { results?: ITunesResult[] }
          const results: ITunesResult[] = data.results || []

          // Collect all results for display
          allResults.push(...results.filter(r => r.previewUrl))

          // Find the best match (same logic as lp-collection.tsx)
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

          // If we found a good match, stop searching
          const minScore = albumHasKorean ? 0.15 : 0.2
          if (bestMatch && bestMatch.score >= minScore) {
            break
          }
        } catch {
          // Continue to next strategy on error
          continue
        }
      }

      // Show best match first, then other results
      const sortedResults: ITunesResult[] = []
      if (bestMatch) {
        sortedResults.push(bestMatch.result)
        // Add other results that aren't the best match
        const otherResults = allResults.filter(
          r => r.previewUrl !== bestMatch?.result.previewUrl
        )
        sortedResults.push(...otherResults.slice(0, 4)) // Limit to 5 total
      } else {
        // No good match found, show all results
        sortedResults.push(...allResults.slice(0, 5))
      }

      setPreviewResults(sortedResults.length > 0 ? sortedResults : null)
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Preview failed.")
    } finally {
      setIsPreviewing(false)
    }
  }

  const savePreference = async () => {
    if (!selectedRelease) return

    const trackTitle = effectiveSelectedTrackTitle
    if (selectedRelease.tracks.length > 0 && !trackTitle) {
      setSaveMsg("Select a track first.")
      return
    }

    setIsSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch(withBasePath("/api/save-preferences"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releaseId: String(selectedRelease.id),
          selectedTrackIndex: selectedRelease.tracks.length === 0 ? -1 : selectedTrackIndex,
          selectedTrackTitle: trackTitle,
          customSearchQuery: (customSearchQuery || "").trim() || undefined,
        }),
      })

      const json = (await res.json().catch(() => null)) as SavePreferencesResponse | null
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Save failed: ${res.status}`)
      }

      setPrefs((prev) => ({
        ...prev,
        [String(selectedRelease.id)]: {
          selectedTrackIndex,
          selectedTrackTitle: trackTitle,
          ...(((customSearchQuery || "").trim().length > 0 && {
            customSearchQuery: customSearchQuery.trim(),
          }) ||
            {}),
        },
      }))

      setSaveMsg("Saved. (Remember to commit data/track-preferences.json for deployment)")
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : "Save failed.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!authed) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-400" />
              Admin
            </CardTitle>
            <CardDescription>
              Enter password to manage Discogs track selection preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin()
              }}
            />
            <Button onClick={handleLogin} className="w-full">
              Unlock
            </Button>
            {saveMsg && <p className="text-xs text-muted-foreground">{saveMsg}</p>}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Discogs Track Selection Admin</h1>
          <p className="text-sm text-muted-foreground">
            fetchedAt: {discogsData.fetchedAt || "unknown"} / releases:{" "}
            {discogsData.releases.length}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setAuthed(false)
            window.localStorage.removeItem("adminAuthed")
          }}
        >
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
        {/* Release list */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Albums</CardTitle>
            <CardDescription>Click an album to choose its preview track.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[70vh] overflow-auto pr-2">
            {discogsData.releases.map((r) => {
              const active = r.id === selectedReleaseId
              return (
                <button
                  key={r.id}
                  className={`w-full text-left flex gap-3 rounded-lg border p-3 transition-colors ${
                    active
                      ? "border-indigo-500/50 bg-indigo-500/10"
                      : "border-border/30 hover:bg-white/5"
                  }`}
                  onClick={() => setSelectedReleaseId(r.id)}
                >
                  <div className="relative h-14 w-14 rounded-md overflow-hidden bg-black/20 flex-shrink-0">
                    <Image
                      src={r.cover_image || "/placeholder.svg"}
                      alt={r.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground line-clamp-1">
                      {r.title}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {r.artist}
                    </div>
                    <div className="text-xs text-indigo-400/70">{r.year || "—"}</div>
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Selection</CardTitle>
            <CardDescription>
              Pick a track per album. Optional custom query overrides iTunes search.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!selectedRelease ? (
              <p className="text-sm text-muted-foreground">Select an album on the left.</p>
            ) : (
              <>
                <div className="flex gap-4 flex-wrap">
                  <div className="relative h-28 w-28 rounded-lg overflow-hidden bg-black/20 flex-shrink-0">
                    <Image
                      src={selectedRelease.cover_image || "/placeholder.svg"}
                      alt={selectedRelease.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-semibold">{selectedRelease.title}</div>
                    <div className="text-sm text-indigo-400">{selectedRelease.artist}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedRelease.year || "—"} · tracks: {selectedRelease.tracks.length}
                    </div>
                    {currentPref && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Current: #{currentPref.selectedTrackIndex + 1} —{" "}
                        {currentPref.selectedTrackTitle}
                        {currentPref.customSearchQuery
                          ? ` (query: ${currentPref.customSearchQuery})`
                          : ""}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Track</Label>
                    <a
                      href={`https://www.discogs.com/release/${selectedRelease.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      Discogs
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <RadioGroup
                    value={String(selectedTrackIndex)}
                    onValueChange={(v) => setSelectedTrackIndex(Number(v))}
                    className="gap-3"
                  >
                    {selectedRelease.tracks.map((t, idx) => {
                      const id = `track-${selectedRelease.id}-${idx}`
                      return (
                        <div
                          key={id}
                          className="flex items-start gap-3 rounded-lg border border-border/30 p-3"
                        >
                          <RadioGroupItem id={id} value={String(idx)} className="mt-1" />
                          <Label htmlFor={id} className="cursor-pointer w-full">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm text-foreground">
                                {t.position ? `${t.position} ` : ""}
                                {t.title}
                              </span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {t.duration || ""}
                              </span>
                            </div>
                          </Label>
                        </div>
                      )
                    })}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Custom iTunes search query (optional)</Label>
                  <Input
                    value={customSearchQuery}
                    onChange={(e) => setCustomSearchQuery(e.target.value)}
                    placeholder='e.g. "조용필 돌아와요 부산항에"'
                  />
                  <p className="text-xs text-muted-foreground">
                    If empty, we search with: <b>{selectedRelease.artist}</b> +{" "}
                    <b>{effectiveSelectedTrackTitle || "selected track"}</b>
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" onClick={runPreview} disabled={isPreviewing}>
                    {isPreviewing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Previewing...
                      </>
                    ) : (
                      <>
                        <Music2 className="h-4 w-4" />
                        iTunes preview test
                      </>
                    )}
                  </Button>
                  <Button onClick={savePreference} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                </div>

                {saveMsg && <p className="text-xs text-muted-foreground">{saveMsg}</p>}

                <div className="space-y-2">
                  <Label>
                    Preview results
                    {previewQuery ? (
                      <>
                        {" "}
                        for: <span className="font-mono">&quot;{previewQuery}&quot;</span>
                      </>
                    ) : null}
                  </Label>
                  {previewError && <p className="text-sm text-red-400">{previewError}</p>}
                  {!previewError && previewResults && previewResults.length === 0 && (
                    <p className="text-sm text-muted-foreground">No results.</p>
                  )}
                  {previewResults && previewResults.length > 0 && (
                    <div className="space-y-2">
                      {previewResults.map((r, idx) => (
                        <div
                          key={`${r.previewUrl ?? "no"}-${idx}`}
                          className="rounded-lg border border-border/30 p-3"
                        >
                          <div className="text-sm font-medium">
                            {r.trackName || "Unknown track"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.artistName || "Unknown artist"} · {r.collectionName || "Unknown album"}
                          </div>
                          <div className="mt-2 flex gap-2 flex-wrap">
                            {r.previewUrl && (
                              <a
                                className="text-xs text-indigo-400 hover:text-indigo-300"
                                href={r.previewUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open previewUrl
                              </a>
                            )}
                            {r.trackViewUrl && (
                              <a
                                className="text-xs text-indigo-400 hover:text-indigo-300"
                                href={r.trackViewUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open iTunes page
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Note: On GitHub Pages (`output: export`), this save API won&apos;t run. After
                  updating preferences locally, commit `data/track-preferences.json` and redeploy.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

