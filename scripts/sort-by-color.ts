import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

// ============================================================================
// Types
// ============================================================================

type Release = {
  id: number
  instance_id: number
  title: string
  artist: string
  year: number
  cover_image: string
  tracks: Array<{ position: string; title: string; duration: string }>
}

type Color = { r: number; g: number; b: number; h: number; s: number; l: number }

type ReleaseWithPalette = Release & {
  palette: Color[]
}

const GRID_COLUMNS = 5
const PALETTE_SIZE = 4 // Number of dominant colors to extract

// ============================================================================
// Color Utilities
// ============================================================================

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

// Create a full Color object from RGB values
function makeColor(r: number, g: number, b: number): Color {
  const hsl = rgbToHsl(r, g, b)
  return { r, g, b, ...hsl }
}

// ============================================================================
// K-Means Clustering for Palette Extraction
// ============================================================================

type RGBPoint = [number, number, number]

function rgbDistance(a: RGBPoint, b: RGBPoint): number {
  const dr = a[0] - b[0]
  const dg = a[1] - b[1]
  const db = a[2] - b[2]
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function kMeansClustering(pixels: RGBPoint[], k: number, maxIterations = 20): RGBPoint[] {
  if (pixels.length === 0) return [[128, 128, 128]]
  if (pixels.length <= k) return pixels

  // Initialize centroids by picking diverse starting points (k-means++)
  const centroids: RGBPoint[] = []
  
  // First centroid: random pixel
  centroids.push(pixels[Math.floor(Math.random() * pixels.length)])
  
  // Subsequent centroids: pick pixels with probability proportional to distance from nearest centroid
  while (centroids.length < k) {
    const distances = pixels.map(p => {
      const minDist = Math.min(...centroids.map(c => rgbDistance(p, c)))
      return minDist * minDist // Square for weighting
    })
    const totalDist = distances.reduce((a, b) => a + b, 0)
    
    if (totalDist === 0) break
    
    let r = Math.random() * totalDist
    for (let i = 0; i < pixels.length; i++) {
      r -= distances[i]
      if (r <= 0) {
        centroids.push(pixels[i])
        break
      }
    }
  }

  // Iterative refinement
  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign pixels to nearest centroid
    const clusters: RGBPoint[][] = centroids.map(() => [])
    
    for (const pixel of pixels) {
      let minDist = Infinity
      let minIdx = 0
      for (let i = 0; i < centroids.length; i++) {
        const d = rgbDistance(pixel, centroids[i])
        if (d < minDist) {
          minDist = d
          minIdx = i
        }
      }
      clusters[minIdx].push(pixel)
    }

    // Update centroids
    let converged = true
    for (let i = 0; i < centroids.length; i++) {
      if (clusters[i].length === 0) continue
      
      const newCentroid: RGBPoint = [
        Math.round(clusters[i].reduce((sum, p) => sum + p[0], 0) / clusters[i].length),
        Math.round(clusters[i].reduce((sum, p) => sum + p[1], 0) / clusters[i].length),
        Math.round(clusters[i].reduce((sum, p) => sum + p[2], 0) / clusters[i].length),
      ]
      
      if (rgbDistance(centroids[i], newCentroid) > 1) {
        converged = false
      }
      centroids[i] = newCentroid
    }
    
    if (converged) break
  }

  // Sort centroids by cluster size (most prominent first)
  const clusterSizes = centroids.map((_, i) => {
    let count = 0
    for (const pixel of pixels) {
      let minDist = Infinity
      let minIdx = 0
      for (let j = 0; j < centroids.length; j++) {
        const d = rgbDistance(pixel, centroids[j])
        if (d < minDist) {
          minDist = d
          minIdx = j
        }
      }
      if (minIdx === i) count++
    }
    return count
  })

  const sortedCentroids = centroids
    .map((c, i) => ({ centroid: c, size: clusterSizes[i] }))
    .sort((a, b) => b.size - a.size)
    .map(x => x.centroid)

  return sortedCentroids
}

// ============================================================================
// Palette Extraction
// ============================================================================

async function extractPalette(imageUrl: string): Promise<Color[]> {
  try {
    // Download image
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)
    
    const buffer = Buffer.from(await response.arrayBuffer())
    
    // Resize to small size for faster processing and extract raw pixels
    const { data, info } = await sharp(buffer)
      .resize(50, 50, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    
    // Convert buffer to array of RGB points
    const pixels: RGBPoint[] = []
    for (let i = 0; i < data.length; i += 3) {
      pixels.push([data[i], data[i + 1], data[i + 2]])
    }
    
    // Run K-means to find dominant colors
    const centroids = kMeansClustering(pixels, PALETTE_SIZE)
    
    // Convert to Color objects
    const palette = centroids.map(([r, g, b]) => makeColor(r, g, b))
    
    return palette
  } catch (error) {
    console.error(`Failed to process image ${imageUrl}:`, error)
    // Return gray palette as fallback
    return [makeColor(128, 128, 128)]
  }
}

// ============================================================================
// Palette Distance (Soft Hausdorff-like)
// ============================================================================

// Perceptual distance between two colors
function colorDistance(c1: Color, c2: Color): number {
  // Weighted combination of RGB and HSL distance
  const dr = c1.r - c2.r
  const dg = c1.g - c2.g
  const db = c1.b - c2.b
  
  // Circular hue distance
  const dh = Math.min(
    Math.abs(c1.h - c2.h),
    360 - Math.abs(c1.h - c2.h)
  )
  const ds = c1.s - c2.s
  const dl = c1.l - c2.l
  
  // Weighted distance emphasizing hue
  return Math.sqrt(
    0.3 * (dr * dr + dg * dg + db * db) +
    0.4 * (dh * dh * 4) +
    0.15 * (ds * ds) +
    0.15 * (dl * dl)
  )
}

// Distance between two palettes using minimum pairwise matching
// Lower = more similar
function paletteDistance(p1: Color[], p2: Color[]): number {
  if (p1.length === 0 || p2.length === 0) return Infinity
  
  // For each color in p1, find the closest color in p2
  // This is a "soft" Hausdorff distance (average of minimums, not max)
  let sumMinDist1 = 0
  for (const c1 of p1) {
    let minDist = Infinity
    for (const c2 of p2) {
      const d = colorDistance(c1, c2)
      if (d < minDist) minDist = d
    }
    sumMinDist1 += minDist
  }
  
  let sumMinDist2 = 0
  for (const c2 of p2) {
    let minDist = Infinity
    for (const c1 of p1) {
      const d = colorDistance(c1, c2)
      if (d < minDist) minDist = d
    }
    sumMinDist2 += minDist
  }
  
  // Average of both directions for symmetry
  return (sumMinDist1 / p1.length + sumMinDist2 / p2.length) / 2
}

// ============================================================================
// Grid-Aware Sorting (5-Column Optimization)
// ============================================================================

function sortByGrid(releases: ReleaseWithPalette[]): ReleaseWithPalette[] {
  if (releases.length <= 1) return releases
  
  const sorted: ReleaseWithPalette[] = []
  const remaining = [...releases]
  
  // Find a good starting item: high saturation and medium lightness (visually striking)
  const startIndex = remaining.reduce((bestIdx, curr, idx, arr) => {
    // Average saturation and lightness across palette
    const avgS = curr.palette.reduce((sum, c) => sum + c.s, 0) / curr.palette.length
    const avgL = curr.palette.reduce((sum, c) => sum + c.l, 0) / curr.palette.length
    // Prefer high saturation and mid-range lightness
    const currScore = avgS * (100 - Math.abs(avgL - 50))
    
    const bestPalette = arr[bestIdx].palette
    const bestAvgS = bestPalette.reduce((sum, c) => sum + c.s, 0) / bestPalette.length
    const bestAvgL = bestPalette.reduce((sum, c) => sum + c.l, 0) / bestPalette.length
    const bestScore = bestAvgS * (100 - Math.abs(bestAvgL - 50))
    
    return currScore > bestScore ? idx : bestIdx
  }, 0)
  
  sorted.push(remaining[startIndex])
  remaining.splice(startIndex, 1)
  
  // Greedy placement considering grid neighbors
  while (remaining.length > 0) {
    const position = sorted.length
    const col = position % GRID_COLUMNS
    const row = Math.floor(position / GRID_COLUMNS)
    
    // Get neighbor palettes
    const leftNeighbor = col > 0 ? sorted[position - 1] : null
    const topNeighbor = row > 0 ? sorted[position - GRID_COLUMNS] : null
    
    let bestIdx = 0
    let bestScore = Infinity
    
    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i]
      let score = 0
      let neighborCount = 0
      
      // Distance to left neighbor (more weight for horizontal continuity)
      if (leftNeighbor) {
        score += paletteDistance(candidate.palette, leftNeighbor.palette) * 1.2
        neighborCount++
      }
      
      // Distance to top neighbor
      if (topNeighbor) {
        score += paletteDistance(candidate.palette, topNeighbor.palette) * 1.0
        neighborCount++
      }
      
      // If we're at the start of a new row (col === 0), also consider diagonal
      // to help maintain flow across row boundaries
      if (col === 0 && row > 0) {
        const topRightNeighbor = sorted[position - GRID_COLUMNS + (GRID_COLUMNS - 1)]
        if (topRightNeighbor) {
          score += paletteDistance(candidate.palette, topRightNeighbor.palette) * 0.5
          neighborCount += 0.5
        }
      }
      
      // Normalize by number of neighbors considered
      if (neighborCount > 0) {
        score /= neighborCount
      }
      
      if (score < bestScore) {
        bestScore = score
        bestIdx = i
      }
    }
    
    sorted.push(remaining[bestIdx])
    remaining.splice(bestIdx, 1)
  }
  
  return sorted
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const INPUT_PATH = path.join(process.cwd(), "data", "discogs-collection.json")
  const OUTPUT_PATH = path.join(process.cwd(), "data", "discogs-collection.json")
  
  console.log("[sort-by-color] Reading collection data...")
  const rawData = await fs.readFile(INPUT_PATH, "utf8")
  const data = JSON.parse(rawData) as { fetchedAt: string; releases: Release[] }
  
  console.log(`[sort-by-color] Extracting color palettes from ${data.releases.length} albums...`)
  console.log(`[sort-by-color] Using ${PALETTE_SIZE} colors per album, optimizing for ${GRID_COLUMNS}-column grid\n`)
  
  const releasesWithPalettes: ReleaseWithPalette[] = []
  
  for (let i = 0; i < data.releases.length; i++) {
    const release = data.releases[i]
    console.log(`[sort-by-color] (${i + 1}/${data.releases.length}) Processing: ${release.title}`)
    
    const palette = await extractPalette(release.cover_image)
    releasesWithPalettes.push({
      ...release,
      palette,
    })
    
    // Small delay to avoid overwhelming the network
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log("\n[sort-by-color] Sorting by color gradient with grid optimization...")
  const sorted = sortByGrid(releasesWithPalettes)
  
  // Log the color progression with palette info
  console.log("\n[sort-by-color] Grid layout preview (5 columns):")
  console.log("═".repeat(120))
  
  for (let row = 0; row < Math.ceil(sorted.length / GRID_COLUMNS); row++) {
    const rowItems = sorted.slice(row * GRID_COLUMNS, (row + 1) * GRID_COLUMNS)
    
    // Print titles
    const titles = rowItems.map(r => r.title.slice(0, 20).padEnd(20)).join(" │ ")
    console.log(`Row ${(row + 1).toString().padStart(2)}: ${titles}`)
    
    // Print primary colors (first color in palette)
    const colors = rowItems.map(r => {
      const c = r.palette[0]
      return `RGB(${c.r.toString().padStart(3)},${c.g.toString().padStart(3)},${c.b.toString().padStart(3)})`
    }).join(" │ ")
    console.log(`        ${colors}`)
    
    // Print hue values for all palette colors
    const hues = rowItems.map(r => {
      return `H:${r.palette.map(c => Math.round(c.h).toString().padStart(3)).join(',')}`
    }).join(" │ ")
    console.log(`        ${hues}`)
    
    console.log("─".repeat(120))
  }
  
  // Remove palette before saving (keep original structure)
  const output = {
    fetchedAt: data.fetchedAt,
    releases: sorted.map(({ palette, ...release }) => release),
  }
  
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf8")
  console.log(`\n[sort-by-color] Saved sorted collection to: ${OUTPUT_PATH}`)
}

main().catch((err) => {
  console.error("[sort-by-color] Failed:", err)
  process.exitCode = 1
})
