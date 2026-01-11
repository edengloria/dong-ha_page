"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Camera, Disc3 } from "lucide-react"

export function GalleryTabs() {
  const pathname = usePathname()
  const isPhotos = pathname?.includes("/gallery/photos")
  const isVinyl = pathname?.includes("/gallery/vinyl")

  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="page-title">Gallery</h1>

      {/* Tab Toggle */}
      <div className="relative flex items-center bg-background/40 backdrop-blur-sm rounded-full p-1 border border-border/30">
        {/* Sliding indicator */}
        <motion.div
          className="absolute h-[calc(100%-8px)] top-1 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-500/25"
          initial={false}
          animate={{
            x: isVinyl ? "calc(100% - 4px)" : 4,
            width: "calc(50% - 0px)", // width 조정
            left: 0 
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{ width: "calc(50% - 4px)" }} // 초기 스타일
        />
        
        <Link
          href="/gallery/photos"
          className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            isPhotos
              ? "text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Camera className="h-4 w-4" />
          <span>Photos</span>
        </Link>
        
        <Link
          href="/gallery/vinyl"
          className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            isVinyl
              ? "text-white"
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
