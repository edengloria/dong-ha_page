import { VinylGalleryView } from "@/components/gallery/vinyl-gallery-view"
import { createMetadata } from "@/lib/metadata"

export const metadata = createMetadata({
  title: "Gallery",
  description: "Gallery index for Dong-Ha Shin, featuring vinyl and photographs.",
  path: "/gallery",
})

export default function GalleryPage() {
  return <VinylGalleryView />
}
