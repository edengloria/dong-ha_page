import { readdirSync } from "node:fs"
import { extname, join } from "node:path"

export interface GalleryItem {
  id: number
  imageUrl: string
}

const imageDir = join(process.cwd(), "public/asset/life-images")
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"])

export function getLifeImageFilenames(): string[] {
  try {
    const files = readdirSync(imageDir)
    return files
      .filter((file) => imageExtensions.has(extname(file).toLowerCase()))
      .sort((left, right) => left.localeCompare(right))
  } catch {
    return []
  }
}

export function getGalleryImages(): GalleryItem[] {
  return getLifeImageFilenames().map((file, index) => ({
    id: index + 1,
    imageUrl: `/asset/life-images/${file}`,
  }))
}
