import { getGalleryImages, PHOTOS_PER_PAGE } from "@/lib/gallery"
import { createMetadata } from "@/lib/metadata"
import { PhotoGallery } from "@/components/gallery/photo-gallery"

export const metadata = createMetadata({
  title: "Gallery / Photos",
  description: "Personal photographs from Dong-Ha Shin.",
  path: "/gallery/photos",
})

export default async function PhotosPage() {
  const galleryItems = await getGalleryImages()

  return <PhotoGallery galleryItems={galleryItems.slice(0, PHOTOS_PER_PAGE)} page={1} pages={Math.ceil(galleryItems.length / PHOTOS_PER_PAGE)} total={galleryItems.length} />
}
