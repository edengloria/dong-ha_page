"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function GalleryTabs() {
  const isPhotos = usePathname().includes("/gallery/photos")
  return <header className="gallery-heading">
    <div><p className="eyebrow mb-2">The personal collection</p><h1 className="page-title">{isPhotos ? "Photo diary" : "Record room"}</h1></div>
    <nav className="gallery-tabs" aria-label="Collections">
      <Link href="/gallery/photos" aria-current={isPhotos ? "page" : undefined}>▧ Photos</Link>
      <Link href="/gallery/vinyl" aria-current={!isPhotos ? "page" : undefined}>♫ Vinyl</Link>
    </nav>
  </header>
}
