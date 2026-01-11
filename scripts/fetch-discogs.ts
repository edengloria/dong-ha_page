import fs from "node:fs/promises"
import path from "node:path"

type DiscogsCollectionItem = {
  id: number
  instance_id: number
  basic_information: {
    id: number
    title: string
    year: number
    cover_image: string
    thumb: string
    artists: Array<{ name: string; id: number }>
  }
}

type DiscogsCollectionResponse = {
  pagination: {
    page: number
    pages: number
    per_page: number
    items: number
  }
  releases: DiscogsCollectionItem[]
}

type DiscogsReleaseDetail = {
  id: number
  tracklist?: Array<{
    position?: string
    title?: string
    duration?: string
    type_?: string
  }>
}

type OutputData = {
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

const DISCOGS_USERNAME = process.env.DISCOGS_USERNAME ?? "edengloria"
const DISCOGS_TOKEN =
  process.env.DISCOGS_TOKEN ?? process.env.NEXT_PUBLIC_DISCOGS_TOKEN ?? ""

const USER_AGENT = "DongHaShinPortfolio/1.0 (+https://github.com/)"

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const OUT_PATH = path.join(process.cwd(), "data", "discogs-collection.json")
const MAX_RELEASES = Number(process.env.DISCOGS_MAX_RELEASES || "0") // 0 = no limit

async function discogsFetchJson<T>(url: string, retries = 3): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        ...(DISCOGS_TOKEN ? { Authorization: `Discogs token=${DISCOGS_TOKEN}` } : {}),
      },
    })

    if (res.ok) {
      return (await res.json()) as T
    }

    // Rate limit: wait longer and retry
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After")
      const waitMs = retryAfter ? Number(retryAfter) * 1000 : (attempt + 1) * 60000 // default: 1min, 2min, 3min
      console.warn(
        `[fetch-discogs] Rate limited (429). Waiting ${Math.round(waitMs / 1000)}s before retry ${attempt + 1}/${retries}...`
      )
      await sleep(waitMs)
      continue
    }

    // Other errors: throw immediately
    const text = await res.text().catch(() => "")
    throw new Error(`Discogs request failed ${res.status} ${res.statusText}: ${text}`)
  }

  throw new Error(`Discogs request failed after ${retries} retries (rate limited)`)
}

async function fetchAllCollectionItems(): Promise<DiscogsCollectionItem[]> {
  const items: DiscogsCollectionItem[] = []

  let page = 1
  let pages = 1

  while (page <= pages) {
    const url = `https://api.discogs.com/users/${encodeURIComponent(
      DISCOGS_USERNAME
    )}/collection/folders/0/releases?per_page=100&sort=added&sort_order=desc&page=${page}`

    const data = await discogsFetchJson<DiscogsCollectionResponse>(url)
    pages = data.pagination.pages
    items.push(...data.releases)

    page += 1
    // small pause between paginated requests
    await sleep(500)
  }

  return items
}

async function fetchReleaseTracks(releaseId: number): Promise<OutputData["releases"][number]["tracks"]> {
  const url = `https://api.discogs.com/releases/${releaseId}`
  const detail = await discogsFetchJson<DiscogsReleaseDetail>(url)
  const tracklist = Array.isArray(detail.tracklist) ? detail.tracklist : []

  return tracklist
    .filter((t) => (t.type_ ?? "track") === "track")
    .map((t) => ({
      position: (t.position ?? "").trim(),
      title: (t.title ?? "").trim(),
      duration: (t.duration ?? "").trim(),
    }))
    .filter((t) => t.title.length > 0)
}

async function readExistingOutput(): Promise<OutputData | null> {
  try {
    const raw = await fs.readFile(OUT_PATH, "utf8")
    const parsed = JSON.parse(raw) as OutputData
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.releases)) return null
    return parsed
  } catch {
    return null
  }
}

async function main() {
  if (!DISCOGS_TOKEN) {
    console.warn(
      "[fetch-discogs] DISCOGS_TOKEN is not set. Requests may be rate-limited or denied."
    )
  }

  console.log(`[fetch-discogs] Fetching collection for user: ${DISCOGS_USERNAME}`)
  let collectionItems = await fetchAllCollectionItems()
  if (MAX_RELEASES > 0) {
    collectionItems = collectionItems.slice(0, MAX_RELEASES)
    console.log(`[fetch-discogs] Limiting to first ${MAX_RELEASES} releases (DISCOGS_MAX_RELEASES).`)
  }
  console.log(`[fetch-discogs] Collection items: ${collectionItems.length}`)

  const existing = await readExistingOutput()
  const existingById = new Map<number, OutputData["releases"][number]>()
  for (const r of existing?.releases ?? []) {
    if (typeof r?.id === "number") existingById.set(r.id, r)
  }

  const releases: OutputData["releases"] = []

  for (let i = 0; i < collectionItems.length; i += 1) {
    const item = collectionItems[i]
    const info = item.basic_information
    const releaseId = info.id

    console.log(`[fetch-discogs] (${i + 1}/${collectionItems.length}) release ${releaseId}: ${info.title}`)

    const previous = existingById.get(releaseId)
    if (previous && Array.isArray(previous.tracks) && previous.tracks.length > 0) {
      releases.push({
        ...previous,
        instance_id: item.instance_id,
        title: info.title,
        artist: (info.artists ?? []).map((a) => a.name).join(", "),
        year: info.year ?? 0,
        cover_image: info.cover_image || info.thumb || "",
      })
      continue
    }

    // Discogs rate limit: 60/min → keep ~1.5s spacing (more conservative)
    const tracks = await fetchReleaseTracks(releaseId)
    releases.push({
      id: releaseId,
      instance_id: item.instance_id,
      title: info.title,
      artist: (info.artists ?? []).map((a) => a.name).join(", "),
      year: info.year ?? 0,
      cover_image: info.cover_image || info.thumb || "",
      tracks,
    })

    await sleep(1500) // Increased from 1100ms to 1500ms for safety
  }

  const out: OutputData = {
    fetchedAt: new Date().toISOString(),
    releases,
  }

  await fs.writeFile(OUT_PATH, JSON.stringify(out, null, 2), "utf8")
  console.log(`[fetch-discogs] Wrote: ${OUT_PATH}`)
}

main().catch((err) => {
  console.error("[fetch-discogs] Failed:", err)
  process.exitCode = 1
})

