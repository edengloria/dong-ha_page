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

// Using CIELAB color space for perceptual uniformity
type ColorLab = { l: number; a: number; b: number }
type Color = { r: number; g: number; b: number } & ColorLab

type ReleaseWithPalette = Release & {
  palette: Color[]
}

const GRID_COLUMNS = 5
const PALETTE_SIZE = 4

// ============================================================================
// Color Space Utilities (RGB <-> XYZ <-> CIELAB)
// ============================================================================

// Standard D65 illuminant
function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  let rr = r / 255
  let gg = g / 255
  let bb = b / 255

  rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92
  gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92
  bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92

  const x = (rr * 0.4124 + gg * 0.3576 + bb * 0.1805) * 100
  const y = (rr * 0.2126 + gg * 0.7152 + bb * 0.0722) * 100
  const z = (rr * 0.0193 + gg * 0.1192 + bb * 0.9505) * 100

  return [x, y, z]
}

function xyzToLab(x: number, y: number, z: number): ColorLab {
  const refX = 95.047
  const refY = 100.000
  const refZ = 108.883

  let xx = x / refX
  let yy = y / refY
  let zz = z / refZ

  xx = xx > 0.008856 ? Math.pow(xx, 1 / 3) : (7.787 * xx) + (16 / 116)
  yy = yy > 0.008856 ? Math.pow(yy, 1 / 3) : (7.787 * yy) + (16 / 116)
  zz = zz > 0.008856 ? Math.pow(zz, 1 / 3) : (7.787 * zz) + (16 / 116)

  return {
    l: (116 * yy) - 16,
    a: 500 * (xx - yy),
    b: 200 * (yy - zz)
  }
}

function makeColor(r: number, g: number, b: number): Color {
  const [x, y, z] = rgbToXyz(r, g, b)
  const lab = xyzToLab(x, y, z)
  return { r, g, b, ...lab }
}

// CIE76 Delta E with Weighted Factors
// Adjusted to balance Hue/Chroma and Lightness
function deltaE(c1: ColorLab, c2: ColorLab): number {
  const dl = c1.l - c2.l
  const da = c1.a - c2.a
  const db = c1.b - c2.b
  
  // Weighting:
  // Lightness (L): 1.0 (Increased from 0.5 to penalize large brightness differences)
  // Color (a, b): 1.2 (Slightly higher to keep colors grouped, but allows L to have effect)
  return Math.sqrt(
    Math.pow(dl * 1.0, 2) + 
    Math.pow(da * 1.2, 2) + 
    Math.pow(db * 1.2, 2)
  )
}

// ============================================================================
// Palette Extraction (K-Means)
// ============================================================================

type RGBPoint = [number, number, number]

function rgbDistance(a: RGBPoint, b: RGBPoint): number {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) +
    Math.pow(a[1] - b[1], 2) +
    Math.pow(a[2] - b[2], 2)
  )
}

function kMeansClustering(pixels: RGBPoint[], k: number, maxIterations = 15): RGBPoint[] {
  if (pixels.length === 0) return [[128, 128, 128]]
  if (pixels.length <= k) return pixels

  // Initialize centroids (K-means++)
  const centroids: RGBPoint[] = []
  centroids.push(pixels[Math.floor(Math.random() * pixels.length)])
  
  while (centroids.length < k) {
    const distances = pixels.map(p => Math.min(...centroids.map(c => rgbDistance(p, c)) ** 2))
    const totalDist = distances.reduce((sum, d) => sum + d, 0)
    
    let r = Math.random() * totalDist
    for (let i = 0; i < pixels.length; i++) {
      r -= distances[i]
      if (r <= 0) {
        centroids.push(pixels[i])
        break
      }
    }
  }

  for (let iter = 0; iter < maxIterations; iter++) {
    const clusters: RGBPoint[][] = Array.from({ length: k }, () => [])
    
    for (const p of pixels) {
      let minIdx = 0
      let minDist = Infinity
      for (let i = 0; i < k; i++) {
        const d = rgbDistance(p, centroids[i])
        if (d < minDist) {
          minDist = d
          minIdx = i
        }
      }
      clusters[minIdx].push(p)
    }

    let converged = true
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue
      const newCentroid: RGBPoint = [
        clusters[i].reduce((s, p) => s + p[0], 0) / clusters[i].length,
        clusters[i].reduce((s, p) => s + p[1], 0) / clusters[i].length,
        clusters[i].reduce((s, p) => s + p[2], 0) / clusters[i].length
      ]
      if (rgbDistance(centroids[i], newCentroid) > 1) converged = false
      centroids[i] = newCentroid
    }
    if (converged) break
  }

  // Sort by cluster size (prominence)
  const sizes = centroids.map(c => {
    return pixels.filter(p => {
      const closest = centroids.reduce((bestIdx, curr, idx) => 
        rgbDistance(p, curr) < rgbDistance(p, centroids[bestIdx]) ? idx : bestIdx, 0)
      return centroids[closest] === c
    }).length
  })

  return centroids
    .map((c, i) => ({ c, size: sizes[i] }))
    .sort((a, b) => b.size - a.size)
    .map(x => x.c)
}

async function extractPalette(imageUrl: string): Promise<Color[]> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    
    const { data } = await sharp(buffer)
      .resize(50, 50, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    
    const pixels: RGBPoint[] = []
    for (let i = 0; i < data.length; i += 3) {
      pixels.push([data[i], data[i + 1], data[i + 2]])
    }
    
    const centroids = kMeansClustering(pixels, PALETTE_SIZE)
    return centroids.map(([r, g, b]) => makeColor(r, g, b))
  } catch (error) {
    console.error(`Failed to process ${imageUrl}`, error)
    return [makeColor(128, 128, 128)]
  }
}

// ============================================================================
// Distance Metrics
// ============================================================================

// Compare two palettes to find visual similarity
// Uses a weighted minimum distance approach (Soft Hausdorff) in Lab space
function paletteDistance(p1: Color[], p2: Color[]): number {
  if (!p1.length || !p2.length) return Infinity

  // Weight the primary color (index 0) more heavily as it defines the overall look
  // Increased to 3.0 to ensure the main color matches well
  const primaryWeight = 3.0
  
  let totalDist = 0
  let comparisons = 0

  // 1. Primary color distance (Dominant vs Dominant)
  totalDist += deltaE(p1[0], p2[0]) * primaryWeight
  comparisons += primaryWeight

  // 2. Average minimum distance for the rest
  // For each color in P1, find closest in P2
  for (let i = 0; i < p1.length; i++) {
    let minD = Infinity
    for (let j = 0; j < p2.length; j++) {
      const d = deltaE(p1[i], p2[j])
      if (d < minD) minD = d
    }
    totalDist += minD
    comparisons++
  }

  // Symmetry: For each color in P2, find closest in P1
  for (let i = 0; i < p2.length; i++) {
    let minD = Infinity
    for (let j = 0; j < p1.length; j++) {
      const d = deltaE(p2[i], p1[j])
      if (d < minD) minD = d
    }
    totalDist += minD
    comparisons++
  }

  return totalDist / comparisons
}

// ============================================================================
// Global Optimization: Simulated Annealing
// ============================================================================

// Calculate the total "energy" (badness) of the grid
// Lower energy = smoother transitions
function calculateGridEnergy(grid: ReleaseWithPalette[]): number {
  let energy = 0
  const rows = Math.ceil(grid.length / GRID_COLUMNS)

  for (let i = 0; i < grid.length; i++) {
    const col = i % GRID_COLUMNS
    const row = Math.floor(i / GRID_COLUMNS)
    
    // Right Neighbor
    if (col < GRID_COLUMNS - 1 && i + 1 < grid.length) {
      energy += paletteDistance(grid[i].palette, grid[i + 1].palette)
    }

    // Bottom Neighbor
    if (row < rows - 1 && i + GRID_COLUMNS < grid.length) {
      energy += paletteDistance(grid[i].palette, grid[i + GRID_COLUMNS].palette)
    }
  }

  return energy
}

function simulatedAnnealingSort(releases: ReleaseWithPalette[]): ReleaseWithPalette[] {
  console.log(`[sort-by-color] Starting Simulated Annealing Optimization...`)
  
  // 1. Initial rough sort to give a good starting point
  // Sort by Hue first, then Lightness to group similar colors initially
  let currentGrid = [...releases].sort((a, b) => {
    const hA = Math.atan2(a.palette[0].b, a.palette[0].a)
    const hB = Math.atan2(b.palette[0].b, b.palette[0].a)
    
    // If hues are significantly different, sort by hue
    if (Math.abs(hA - hB) > 0.2) {
      return hA - hB
    }
    // If hues are similar, sort by lightness
    return a.palette[0].l - b.palette[0].l
  })

  let currentEnergy = calculateGridEnergy(currentGrid)
  let bestGrid = [...currentGrid]
  let bestEnergy = currentEnergy

  // Annealing parameters
  let temp = 1000       // Initial temperature
  const coolingRate = 0.9995 // Cooling rate (slower = better quality, slower speed)
  const minTemp = 0.1   // Stop temperature
  
  // Adjust iterations based on collection size, but cap it to ensure build finishes
  // For ~100 items, 50k-100k iterations is instant.
  const maxIterations = 200000 
  
  let iter = 0
  while (temp > minTemp && iter < maxIterations) {
    // Pick two random indices to swap
    const idx1 = Math.floor(Math.random() * currentGrid.length)
    const idx2 = Math.floor(Math.random() * currentGrid.length)

    if (idx1 === idx2) continue

    // Calculate energy change only for affected neighbors (optimization)
    // But for simplicity and robustness in this script, we can recalculate or do delta.
    // Given the array size is small (<1000), full recalc is fast enough.
    // Let's do a speculative swap.
    const tempGrid = [...currentGrid]
    ;[tempGrid[idx1], tempGrid[idx2]] = [tempGrid[idx2], tempGrid[idx1]]
    
    const newEnergy = calculateGridEnergy(tempGrid)
    const delta = newEnergy - currentEnergy

    // Acceptance probability
    if (delta < 0 || Math.random() < Math.exp(-delta / temp)) {
      currentGrid = tempGrid
      currentEnergy = newEnergy

      if (currentEnergy < bestEnergy) {
        bestEnergy = currentEnergy
        bestGrid = [...currentGrid]
      }
    }

    temp *= coolingRate
    iter++

    if (iter % 10000 === 0) {
      process.stdout.write(`\r[sort-by-color] Iteration ${iter}/${maxIterations} | Temp: ${temp.toFixed(1)} | Energy: ${bestEnergy.toFixed(1)}   `)
    }
  }
  
  console.log(`\n[sort-by-color] Optimization complete. Final Energy: ${bestEnergy.toFixed(1)}`)
  return bestGrid
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const INPUT_PATH = path.join(process.cwd(), "data", "discogs-collection.json")
  
  console.log("[sort-by-color] Reading collection data...")
  const rawData = await fs.readFile(INPUT_PATH, "utf8")
  const data = JSON.parse(rawData) as { fetchedAt: string; releases: Release[] }
  
  console.log(`[sort-by-color] Processing ${data.releases.length} albums...`)
  
  const releasesWithPalettes: ReleaseWithPalette[] = []
  
  // Parallel processing with concurrency limit could be faster, but sequential is safer for rate limits/memory
  for (let i = 0; i < data.releases.length; i++) {
    const release = data.releases[i]
    // Simple progress log every 5 items
    if (i % 5 === 0) process.stdout.write(`\r[sort-by-color] Extracting palettes: ${i}/${data.releases.length}`)
    
    const palette = await extractPalette(release.cover_image)
    releasesWithPalettes.push({ ...release, palette })
  }
  console.log("\n[sort-by-color] Palette extraction complete.")
  
  // Run the Global Optimization
  const sorted = simulatedAnnealingSort(releasesWithPalettes)
  
  // Visualization Log
  console.log("\n[sort-by-color] Grid layout preview (First 5 Rows):")
  console.log("═".repeat(100))
  
  const previewRows = Math.min(5, Math.ceil(sorted.length / GRID_COLUMNS))
  for (let row = 0; row < previewRows; row++) {
    const rowItems = sorted.slice(row * GRID_COLUMNS, (row + 1) * GRID_COLUMNS)
    
    // Titles
    console.log(rowItems.map(r => r.title.slice(0, 15).padEnd(15)).join(" │ "))
    
    // Colors (RGB)
    console.log(rowItems.map(r => {
      const c = r.palette[0]
      return `R${c.r.toString().padStart(3)} G${c.g.toString().padStart(3)} B${c.b.toString().padStart(3)}`
    }).join(" │ "))
    
    console.log("─".repeat(100))
  }

  const output = {
    fetchedAt: data.fetchedAt,
    releases: sorted.map(({ palette, ...release }) => release),
  }
  
  await fs.writeFile(INPUT_PATH, JSON.stringify(output, null, 2), "utf8")
  console.log(`[sort-by-color] Saved globally optimized collection to: ${INPUT_PATH}`)
}

main().catch((err) => {
  console.error("[sort-by-color] Failed:", err)
  process.exitCode = 1
})
