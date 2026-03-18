import type { TrackPreferences } from "@/lib/discogs"

interface ITunesResult {
  previewUrl?: string
  trackName?: string
  artistName?: string
  collectionName?: string
}

export interface PreviewSearchPlan {
  albumHasKorean: boolean
  cleanAlbum: string
  cleanArtist: string
  customQuery?: string
  koreanArtist: string | null
  originalAlbum: string
  originalArtist: string
  preferredQuery: string
  searchStrategies: string[]
}

export interface PreviewData {
  url: string
  trackName: string
  artistName: string
  albumName: string
}

const ARTIST_KOREAN_MAP: Record<string, string> = {
  "cho yong-pil": "Cho Yong-pil",
  "cho yongpil": "Cho Yong-pil",
  "cheong tae choon": "Cheong Tae-choon",
  "chung tae chun": "Cheong Tae-choon",
  "kim kwang seok": "Kim Kwang Seok",
  "siinkwa chonjang": "Si In-gang",
  "shin seung hun": "Shin Seung-hun",
  "lee moon sae": "Lee Moon-sae",
  "lee moon-sae": "Lee Moon-sae",
  "yoo jae ha": "Yoo Jae-ha",
  "kim hyun sik": "Kim Hyun-sik",
  deulgukhwa: "Deulgukhwa",
  sanullim: "Sanullim",
  "song chang sik": "Song Chang-sik",
  "yang hee eun": "Yang Hee-eun",
  "han dae soo": "Han Dae-soo",
  "kim min ki": "Kim Min-ki",
  "jeon in kwon": "Jeon In-kwon",
  "bom yeoreum gaeul gyeoul": "Bom Yeoreum Gaeul Gyeoul",
  "spring summer fall winter": "Spring Summer Fall Winter",
  "light and salt": "Light and Salt",
  "bitgwa sogeum": "Bitgwa Sogeum",
  yoonsang: "Yoonsang",
  "yoon sang": "Yoon Sang",
}

export function containsKorean(text: string): boolean {
  return /[\uAC00-\uD7AF\u4E00-\u9FFF]/.test(text)
}

export function getKoreanArtistName(romanized: string): string | null {
  const normalized = romanized.toLowerCase().trim()
  return ARTIST_KOREAN_MAP[normalized] || null
}

export function cleanupMusicSearchText(text: string): string {
  return text
    .replace(/\s*[\(\[].*?[\)\]]\s*/g, " ")
    .replace(/\s*(deluxe|remaster|edition|anniversary|expanded|bonus|disc \d+|cd \d+|vinyl|lp).*$/i, "")
    .replace(/\s*(feat\.?|ft\.?|featuring)\s+.*/i, "")
    .replace(/['"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()

  if (s1 === s2) return 1
  if (s1.includes(s2) || s2.includes(s1)) return 0.8

  const words1 = s1.split(/\s+/)
  const words2 = s2.split(/\s+/)
  const commonWords = words1.filter((word) =>
    words2.some((candidate) => candidate.includes(word) || word.includes(candidate))
  )

  return commonWords.length / Math.max(words1.length, words2.length)
}

export function createPreviewSearchPlan({
  album,
  artist,
  customQuery,
  preferredQuery,
}: {
  album: string
  artist: string
  customQuery?: string
  preferredQuery: string
}): PreviewSearchPlan {
  const cleanArtist = cleanupMusicSearchText(artist)
  const cleanAlbum = cleanupMusicSearchText(album)
  const koreanArtist = getKoreanArtistName(artist) || getKoreanArtistName(cleanArtist)
  const albumHasKorean = containsKorean(album)
  const searchStrategies: string[] = []

  if (preferredQuery) {
    searchStrategies.push(preferredQuery)
  }

  if (koreanArtist) {
    searchStrategies.push(`${koreanArtist} ${cleanAlbum}`)
    searchStrategies.push(koreanArtist)
  }

  if (albumHasKorean) {
    searchStrategies.push(cleanAlbum)
    searchStrategies.push(`${cleanAlbum} ${cleanArtist}`)
  }

  searchStrategies.push(`${cleanArtist} ${cleanAlbum}`)
  searchStrategies.push(`${artist} ${album}`)
  searchStrategies.push(cleanArtist)

  return {
    albumHasKorean,
    cleanAlbum,
    cleanArtist,
    customQuery,
    koreanArtist,
    originalAlbum: album,
    originalArtist: artist,
    preferredQuery,
    searchStrategies,
  }
}

export function resolvePreferredPreviewQuery({
  album,
  artist,
  prefs,
  releaseId,
}: {
  album: string
  artist: string
  prefs: TrackPreferences
  releaseId: number
}): {
  customQuery?: string
  preferredQuery: string
  selectedTitle?: string
} {
  const pref = prefs[String(releaseId)]
  const customQuery = pref?.customSearchQuery?.trim()
  const selectedTitle = pref?.selectedTrackTitle?.trim()

  return {
    customQuery,
    preferredQuery: customQuery || `${artist} ${selectedTitle || album}`.trim(),
    selectedTitle,
  }
}

export function findBestPreviewMatch(
  results: ITunesResult[],
  plan: PreviewSearchPlan
): PreviewData | null {
  if (plan.customQuery) {
    const first = results.find((result) => Boolean(result.previewUrl))
    if (!first?.previewUrl) return null

    return {
      url: first.previewUrl,
      trackName: first.trackName || "Unknown Track",
      artistName: first.artistName || plan.originalArtist,
      albumName: first.collectionName || plan.originalAlbum,
    }
  }

  let bestMatch: { result: ITunesResult; score: number } | null = null

  for (const result of results) {
    if (!result.previewUrl) continue

    const resultArtist = result.artistName || ""
    const resultAlbum = result.collectionName || ""
    const cleanResultArtist = cleanupMusicSearchText(resultArtist)
    const cleanResultAlbum = cleanupMusicSearchText(resultAlbum)

    let artistSim = calculateSimilarity(plan.cleanArtist, cleanResultArtist)
    if (plan.koreanArtist) {
      artistSim = Math.max(
        artistSim,
        calculateSimilarity(plan.koreanArtist, cleanResultArtist)
      )
    }

    const albumSim = calculateSimilarity(plan.cleanAlbum, cleanResultAlbum)
    const score = artistSim * 0.5 + albumSim * 0.5
    const isValid =
      artistSim >= 0.2 ||
      albumSim >= 0.4 ||
      (plan.albumHasKorean && albumSim >= 0.3)

    if (isValid && score > (bestMatch?.score ?? 0)) {
      bestMatch = { result, score }
    }
  }

  const minScore = plan.albumHasKorean ? 0.15 : 0.2
  if (!bestMatch || bestMatch.score < minScore || !bestMatch.result.previewUrl) {
    return null
  }

  return {
    url: bestMatch.result.previewUrl,
    trackName: bestMatch.result.trackName || "Unknown Track",
    artistName: bestMatch.result.artistName || plan.originalArtist,
    albumName: bestMatch.result.collectionName || plan.originalAlbum,
  }
}
