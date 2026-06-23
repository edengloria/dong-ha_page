import type React from "react"
import { GalleryTabs } from "@/components/gallery/gallery-tabs"

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section>
      <GalleryTabs />
      {children}
    </section>
  )
}
