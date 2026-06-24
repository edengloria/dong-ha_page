import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

type DiscogsRelease = {
  id: number
  instance_id: number
  title: string
  cover_image: string
  local_cover_image?: string
}

type DiscogsCollection = {
  fetchedAt: string
  releases: DiscogsRelease[]
}

const DATA_PATH = path.join(process.cwd(), "data", "discogs-collection.json")
const OUTPUT_DIR = path.join(process.cwd(), "public", "asset", "discogs-covers")
const PUBLIC_PREFIX = "/asset/discogs-covers"
const USER_AGENT = "DongHaShinPortfolio/1.0 (+https://github.com/)"

function coverFileName(release: DiscogsRelease) {
  return `${release.id}-${release.instance_id}.webp`
}

async function readCollection() {
  const raw = await fs.readFile(DATA_PATH, "utf8")
  return JSON.parse(raw) as DiscogsCollection
}

async function fetchImage(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "image/avif,image/webp,image/*,*/*",
      "User-Agent": USER_AGENT,
    },
  })

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

async function cacheCover(release: DiscogsRelease) {
  const fileName = coverFileName(release)
  const outputPath = path.join(OUTPUT_DIR, fileName)

  try {
    await fs.access(outputPath)
  } catch {
    if (!release.cover_image) {
      throw new Error("missing cover_image")
    }

    const input = await fetchImage(release.cover_image)
    await sharp(input)
      .rotate()
      .resize({
        width: 520,
        height: 520,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 76, effort: 5 })
      .toFile(outputPath)
  }

  return `${PUBLIC_PREFIX}/${fileName}`
}

async function main() {
  const collection = await readCollection()
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  let cached = 0
  let skipped = 0

  for (const release of collection.releases) {
    try {
      release.local_cover_image = await cacheCover(release)
      cached += 1
      console.log(`[cache-discogs-covers] ${cached}/${collection.releases.length} ${release.title}`)
    } catch (error) {
      skipped += 1
      console.warn(
        `[cache-discogs-covers] skipped ${release.id} ${release.title}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  await fs.writeFile(DATA_PATH, `${JSON.stringify(collection, null, 2)}\n`, "utf8")
  console.log(
    `[cache-discogs-covers] cached ${cached}, skipped ${skipped}, wrote ${DATA_PATH}`
  )
}

main().catch((error) => {
  console.error("[cache-discogs-covers] failed", error)
  process.exitCode = 1
})
