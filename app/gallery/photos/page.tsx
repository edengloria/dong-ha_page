import { getGalleryImages } from "@/lib/gallery"
import { createMetadata } from "@/lib/metadata"
import { PhotoGallery } from "@/components/gallery/photo-gallery"

export const metadata = createMetadata({
  title: "Gallery / Photos",
  description: "A rotating selection of personal photographs from Dong-Ha Shin.",
  path: "/gallery/photos",
})

export default function PhotosPage() {
  const galleryItems = getGalleryImages()

  return <PhotoGallery galleryItems={galleryItems} />
}
