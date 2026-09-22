import { readdirSync } from "node:fs"
import { extname, join } from "node:path"
import sharp from "sharp"

export interface GalleryItem {
  id: number
  imageUrl: string
  width: number
  height: number
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

export const PHOTOS_PER_PAGE = 24
export const photoPagePath = (page: number) => page === 1 ? "/gallery/photos/" : `/gallery/photos/page/${page}/`
let cachedImages: Promise<GalleryItem[]> | undefined
export function getGalleryImages(): Promise<GalleryItem[]> {
  // Generated thumbnails have their EXIF orientation applied. Keep their actual
  // dimensions in the document so portrait photographs are never square-cropped.
  cachedImages ??= Promise.all(getLifeImageFilenames().map(async (file, index) => {
    const { width, height } = await sharp(join(process.cwd(), "public/asset/life-thumbs", `${file}.webp`)).metadata()
    if (!width || !height) throw new Error(`Missing thumbnail dimensions: ${file}`)
    return { id: index + 1, imageUrl: `/asset/life-images/${file}`, width, height }
  }))
  return cachedImages
}
