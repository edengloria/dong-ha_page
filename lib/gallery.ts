import { readdirSync } from "fs"
import { join } from "path"

export interface GalleryItem {
  id: number
  imageUrl: string
}

export function getGalleryImages(): GalleryItem[] {
  const imageDir = join(process.cwd(), "public/asset/life-images")
  
  try {
    const files = readdirSync(imageDir)
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
    
    const images = files
      .filter((file) => {
        const ext = file.toLowerCase().slice(file.lastIndexOf("."))
        return imageExtensions.includes(ext)
      })
      .map((file, index) => ({
        id: index + 1,
        imageUrl: `/asset/life-images/${file}`,
      }))
    
    return images
  } catch {
    return []
  }
}
