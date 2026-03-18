"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { ExternalLink, Loader2, Music2, Save, Shield } from "lucide-react"

import { withBasePath } from "@/lib/utils"
import {
  getDiscogsCollection,
  getTrackPreferences,
  type TrackPreferences,
} from "@/lib/discogs"
import {
  createPreviewSearchPlan,
  findBestPreviewMatch,
} from "@/lib/music-preview"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

type ITunesResult = {
  trackName?: string
  artistName?: string
  collectionName?: string
  previewUrl?: string
  trackViewUrl?: string
}

type SavePreferencesResponse = { ok: boolean; error?: string }

const discogsData = getDiscogsCollection()
const initialPrefs = getTrackPreferences()

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
    const plan = createPreviewSearchPlan({
      album: originalAlbum,
      artist: originalArtist,
      customQuery,
      preferredQuery,
    })

    if (!preferredQuery) return

    setIsPreviewing(true)
    setPreviewError(null)
    setPreviewResults(null)
    setPreviewQuery(preferredQuery)

    try {
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

      let allResults: ITunesResult[] = []
      let bestMatch: { result: ITunesResult; score: number } | null = null

      for (const query of plan.searchStrategies) {
        try {
          const res = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5&country=kr`
          )
          if (!res.ok) continue

          const data = (await res.json()) as { results?: ITunesResult[] }
          const results: ITunesResult[] = data.results || []

          allResults.push(...results.filter((result) => result.previewUrl))

          const matchedPreview = findBestPreviewMatch(results, plan)
          if (matchedPreview?.url) {
            const matchedResult = results.find(
              (result) => result.previewUrl === matchedPreview.url
            )

            if (matchedResult?.previewUrl) {
              bestMatch = { result: matchedResult, score: 1 }
            }
          }

          if (bestMatch) {
            break
          }
        } catch {
          continue
        }
      }

      const sortedResults: ITunesResult[] = []
      if (bestMatch) {
        sortedResults.push(bestMatch.result)
        const otherResults = allResults.filter(
          (result) => result.previewUrl !== bestMatch?.result.previewUrl
        )
        sortedResults.push(...otherResults.slice(0, 4))
      } else {
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
              <Shield className="h-5 w-5 text-postech-red" />
              Admin
            </CardTitle>
            <CardDescription>
              Enter password to manage Discogs track selection preferences.
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="password"
            placeholder="Enter password"
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
                      ? "border-postech-red/50 bg-postech-red/10"
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
                    <div className="text-xs text-postech-red/70">{r.year || "Unknown"}</div>
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
                    <div className="text-sm text-postech-red">{selectedRelease.artist}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedRelease.year || "Unknown"} · {selectedRelease.tracks.length} tracks
                    </div>
                    {currentPref && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Current: #{currentPref.selectedTrackIndex + 1} · {currentPref.selectedTrackTitle}
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
                      className="text-xs text-postech-red hover:text-postech-orange flex items-center gap-1"
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
                    placeholder='e.g. "Come Back to Busan Port by Cho Yong-pil"'
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
                  {previewError && <p className="text-sm text-postech-red">{previewError}</p>}
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
                                className="text-xs text-postech-red hover:text-postech-orange"
                                href={r.previewUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open previewUrl
                              </a>
                            )}
                            {r.trackViewUrl && (
                              <a
                                className="text-xs text-postech-red hover:text-postech-orange"
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
