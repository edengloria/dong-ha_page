"use client"
import { withBasePath, withoutBasePath } from "@/lib/utils"
import { usePathname } from "next/navigation"

export function GalleryTabs() {
  const isPhotos = withoutBasePath(usePathname()).startsWith("/gallery/photos")
  return <header className="gallery-heading">
    <div><p className="eyebrow mb-2">The personal collection</p><h1 className="page-title">{isPhotos ? "Photo diary" : "Record room"}</h1></div>
    <nav className="gallery-tabs" aria-label="Collections">
      <a href={withBasePath("/gallery/photos/")} aria-current={isPhotos ? "page" : undefined}>[ Photos ]</a>
      <a href={withBasePath("/gallery/vinyl/")} aria-current={!isPhotos ? "page" : undefined}>[ Vinyl ]</a>
    </nav>
  </header>
}
