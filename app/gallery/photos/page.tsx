import { getGalleryImages } from "@/lib/gallery"
import PhotosClient from "./photos-client"

export default function PhotosPage() {
  const galleryItems = getGalleryImages()
  
  return <PhotosClient galleryItems={galleryItems} />
}
