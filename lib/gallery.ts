import { readdirSync } from "node:fs"
import { extname, join } from "node:path"

export interface GalleryItem {
  id: number
  imageUrl: string
}

const imageDir = join(process.cwd(), "public/asset/life-images")
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"])

let cachedLifeImageFilenames: string[] | null = null

function loadLifeImageFilenames() {
  if (cachedLifeImageFilenames) {
    return cachedLifeImageFilenames
  }

  try {
    const files = readdirSync(imageDir)
    cachedLifeImageFilenames = files
      .filter((file) => imageExtensions.has(extname(file).toLowerCase()))
      .sort((left, right) => left.localeCompare(right))
  } catch {
    cachedLifeImageFilenames = []
  }

  return cachedLifeImageFilenames
}

export function getLifeImageFilenames(): string[] {
  return loadLifeImageFilenames()
}

export function getGalleryImages(): GalleryItem[] {
  return getLifeImageFilenames().map((file, index) => ({
    id: index + 1,
    imageUrl: `/asset/life-images/${file}`,
  }))
}
