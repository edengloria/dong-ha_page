"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Camera, Disc3 } from "lucide-react"

export function GalleryTabs() {
  const pathname = usePathname()
  const normalizedPath = pathname?.replace(/\/$/, "")
  const isPhotos = normalizedPath?.includes("/gallery/photos")
  const isVinyl = normalizedPath === "/gallery" || normalizedPath?.includes("/gallery/vinyl")

  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="page-title">Gallery</h1>

      <div className="relative flex items-center bg-background/40 backdrop-blur-sm rounded-full p-1 border border-border/30 w-[200px]">
        <div
          className="absolute top-1 bottom-1 left-1 rounded-full bg-gradient-to-r from-postech-red to-postech-red/80 shadow-lg shadow-postech-red/30"
          aria-hidden="true"
          style={{
            width: "calc(50% - 4px)",
            transform: isVinyl ? "translateX(100%)" : "translateX(0)",
            transition: "transform 250ms ease",
          }}
        />

        <Link
          href="/gallery/photos"
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            isPhotos
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Camera className="h-4 w-4" />
          <span>Photos</span>
        </Link>
        
        <Link
          href="/gallery/vinyl"
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            isVinyl
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Disc3 className="h-4 w-4" />
          <span>Vinyl</span>
        </Link>
      </div>
    </div>
  )
}
