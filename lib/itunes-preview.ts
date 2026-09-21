import { findBestPreviewMatch, type PreviewData, type PreviewSearchPlan } from "@/lib/music-preview"

// Availability differs by storefront; a successful KR response may contain no songs.
const STOREFRONTS = ["kr", "us", "jp"] as const
const REQUEST_TIMEOUT_MS = 4000

export async function searchItunesPreview(
  plan: PreviewSearchPlan,
  signal: AbortSignal
): Promise<PreviewData | null> {
  let receivedResults = false
  for (const query of new Set(plan.searchStrategies)) {
    for (const country of STOREFRONTS) {
      if (signal.aborted) throw new DOMException("Preview search cancelled", "AbortError")
      const request = new AbortController()
      const abort = () => request.abort()
      signal.addEventListener("abort", abort, { once: true })
      const timeout = setTimeout(abort, REQUEST_TIMEOUT_MS)
      try {
        const params = new URLSearchParams({ term: query, entity: "song", limit: "5", country })
        const response = await fetch(`https://itunes.apple.com/search?${params}`, { signal: request.signal })
        if (!response.ok) continue
        const data = await response.json()
        if (!Array.isArray(data.results)) continue
        receivedResults = true
        const match = findBestPreviewMatch(data.results, plan)
        if (match) return match
      } catch (error) {
        if (signal.aborted) throw error
        // A transient regional failure must not block the other storefronts.
      } finally {
        clearTimeout(timeout)
        signal.removeEventListener("abort", abort)
      }
    }
  }
  if (!receivedResults) throw new Error("Preview search is temporarily unavailable")
  return null
}
