import { GalleryTabs } from "@/components/gallery-tabs"

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <GalleryTabs />
      {children}
    </div>
  )
}
