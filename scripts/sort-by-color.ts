import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

type Release = {
  id: number
  instance_id: number
  title: string
  artist: string
  year: number
  cover_image: string
  tracks: Array<{ position: string; title: string; duration: string }>
}

type ReleaseWithColor = Release & {
  dominantColor: { r: number; g: number; b: number; h: number; s: number; l: number }
}

// RGB to HSL conversion
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

// Download and analyze image
async function extractDominantColor(imageUrl: string): Promise<{ r: number; g: number; b: number; h: number; s: number; l: number }> {
  try {
    // Download image
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)
    
    const buffer = Buffer.from(await response.arrayBuffer())
    
    // Resize to small size for faster processing and get dominant color
    const { dominant } = await sharp(buffer)
      .resize(100, 100, { fit: 'cover' })
      .stats()
    
    const r = Math.round(dominant.r)
    const g = Math.round(dominant.g)
    const b = Math.round(dominant.b)
    const hsl = rgbToHsl(r, g, b)
    
    return { r, g, b, ...hsl }
  } catch (error) {
    console.error(`Failed to process image ${imageUrl}:`, error)
    // Return gray as fallback
    return { r: 128, g: 128, b: 128, h: 0, s: 0, l: 50 }
  }
}

// Calculate color distance in LAB color space (perceptually uniform)
function colorDistance(c1: ReleaseWithColor, c2: ReleaseWithColor): number {
  // Convert RGB to LAB-like distance (simplified)
  // Using weighted Euclidean distance with more weight on hue
  const dr = c1.dominantColor.r - c2.dominantColor.r
  const dg = c1.dominantColor.g - c2.dominantColor.g
  const db = c1.dominantColor.b - c2.dominantColor.b
  
  // Also consider HSL for better perceptual matching
  const dh = Math.min(Math.abs(c1.dominantColor.h - c2.dominantColor.h), 360 - Math.abs(c1.dominantColor.h - c2.dominantColor.h))
  const ds = c1.dominantColor.s - c2.dominantColor.s
  const dl = c1.dominantColor.l - c2.dominantColor.l
  
  // Weighted distance: RGB + HSL components
  return Math.sqrt(
    0.3 * (dr * dr + dg * dg + db * db) +
    0.5 * (dh * dh * 4) + // More weight on hue difference
    0.1 * (ds * ds) +
    0.1 * (dl * dl)
  )
}

// Greedy TSP: Start with first item, always pick nearest unvisited neighbor
function sortByColorGradient(releases: ReleaseWithColor[]): ReleaseWithColor[] {
  if (releases.length <= 1) return releases
  
  const sorted: ReleaseWithColor[] = []
  const remaining = [...releases]
  
  // Start with a random item (or pick one with specific color)
  // Let's start with the most saturated and bright item for visual impact
  const startIndex = remaining.reduce((maxIdx, curr, idx, arr) => {
    const currScore = curr.dominantColor.s * curr.dominantColor.l
    const maxScore = arr[maxIdx].dominantColor.s * arr[maxIdx].dominantColor.l
    return currScore > maxScore ? idx : maxIdx
  }, 0)
  
  sorted.push(remaining[startIndex])
  remaining.splice(startIndex, 1)
  
  // Greedy: always pick the nearest neighbor
  while (remaining.length > 0) {
    const current = sorted[sorted.length - 1]
    let nearestIdx = 0
    let nearestDist = colorDistance(current, remaining[0])
    
    for (let i = 1; i < remaining.length; i++) {
      const dist = colorDistance(current, remaining[i])
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIdx = i
      }
    }
    
    sorted.push(remaining[nearestIdx])
    remaining.splice(nearestIdx, 1)
  }
  
  return sorted
}

async function main() {
  const INPUT_PATH = path.join(process.cwd(), "data", "discogs-collection.json")
  const OUTPUT_PATH = path.join(process.cwd(), "data", "discogs-collection.json")
  
  console.log("[sort-by-color] Reading collection data...")
  const rawData = await fs.readFile(INPUT_PATH, "utf8")
  const data = JSON.parse(rawData) as { fetchedAt: string; releases: Release[] }
  
  console.log(`[sort-by-color] Extracting dominant colors from ${data.releases.length} albums...`)
  
  const releasesWithColors: ReleaseWithColor[] = []
  
  for (let i = 0; i < data.releases.length; i++) {
    const release = data.releases[i]
    console.log(`[sort-by-color] (${i + 1}/${data.releases.length}) Processing: ${release.title}`)
    
    const dominantColor = await extractDominantColor(release.cover_image)
    releasesWithColors.push({
      ...release,
      dominantColor,
    })
    
    // Small delay to avoid overwhelming the network
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log("[sort-by-color] Sorting by color gradient...")
  const sorted = sortByColorGradient(releasesWithColors)
  
  // Log the color progression
  console.log("\n[sort-by-color] Color progression:")
  sorted.forEach((release, idx) => {
    const c = release.dominantColor
    console.log(
      `${idx + 1}. ${release.title.slice(0, 30).padEnd(30)} | ` +
      `RGB(${c.r.toString().padStart(3)},${c.g.toString().padStart(3)},${c.b.toString().padStart(3)}) | ` +
      `HSL(${Math.round(c.h).toString().padStart(3)}°,${Math.round(c.s).toString().padStart(3)}%,${Math.round(c.l).toString().padStart(3)}%)`
    )
  })
  
  // Remove dominantColor before saving (keep original structure)
  const output = {
    fetchedAt: data.fetchedAt,
    releases: sorted.map(({ dominantColor, ...release }) => release),
  }
  
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf8")
  console.log(`\n[sort-by-color] Saved sorted collection to: ${OUTPUT_PATH}`)
}

main().catch((err) => {
  console.error("[sort-by-color] Failed:", err)
  process.exitCode = 1
})
