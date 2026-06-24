"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { withBasePath } from "@/lib/utils"

const DEFAULT_IMAGE = "/asset/about-portrait.webp"
const RANDOM_IMAGE_DELAY_MS = 8000

export function AboutPortrait({
  alt,
  images,
}: {
  alt: string
  images: string[]
}) {
  const [selectedImage, setSelectedImage] = useState<string>(DEFAULT_IMAGE)

  useEffect(() => {
    if (images.length === 0) {
      return
    }

    const timeout = window.setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * images.length)
      setSelectedImage(`/asset/life-images/${images[randomIndex]}`)
    }, RANDOM_IMAGE_DELAY_MS)

    return () => window.clearTimeout(timeout)
  }, [images])

  return (
    <div className="relative md:col-span-1">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border/60 surface-frame">
        <Image
          src={withBasePath(selectedImage)}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
    </div>
  )
}
