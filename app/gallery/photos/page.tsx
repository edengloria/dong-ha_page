import { getGalleryImages } from "@/lib/gallery"
import PhotosClient from "./photos-client"

export default function PhotosPage() {
  const galleryItems = getGalleryImages()
  
  // Random shuffle items on the server side
  const shuffledItems = [...galleryItems].sort(() => Math.random() - 0.5)
  
  return <PhotosClient galleryItems={shuffledItems} />
}
