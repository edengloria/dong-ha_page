import { notFound } from "next/navigation"
import { getGalleryImages, PHOTOS_PER_PAGE, photoPagePath } from "@/lib/gallery"
import { createMetadata } from "@/lib/metadata"
import { PhotoGallery } from "@/components/gallery/photo-gallery"

export async function generateStaticParams() {
  const images = await getGalleryImages()
  return Array.from({ length: Math.max(0, Math.ceil(images.length / PHOTOS_PER_PAGE) - 1) }, (_, i) => ({ page: String(i + 2) }))
}
export const dynamicParams = false
type Props = { params: Promise<{ page: string }> }
export async function generateMetadata({ params }: Props) {
  const { page } = await params
  return createMetadata({ title: `Gallery / Photos / ${page}`, path: photoPagePath(Number(page)) })
}
export default async function PhotosPage({ params }: Props) {
  const page = Number((await params).page), images = await getGalleryImages()
  const pages = Math.ceil(images.length / PHOTOS_PER_PAGE)
  if (!Number.isInteger(page) || page < 2 || page > pages) notFound()
  return <PhotoGallery galleryItems={images.slice((page - 1) * PHOTOS_PER_PAGE, page * PHOTOS_PER_PAGE)} page={page} pages={pages} total={images.length} />
}
