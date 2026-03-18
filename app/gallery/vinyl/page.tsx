import { VinylGalleryView } from "@/components/gallery/vinyl-gallery-view"
import { createMetadata } from "@/lib/metadata"

export const metadata = createMetadata({
  title: "Gallery / Vinyl",
  description: "A browsable view of Dong-Ha Shin's vinyl collection with preview tracks.",
  path: "/gallery/vinyl",
})

export default function VinylPage() {
  return <VinylGalleryView />
}
