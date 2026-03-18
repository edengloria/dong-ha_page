"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { withBasePath } from "@/lib/utils"

export function AboutPortrait({
  alt,
  images,
}: {
  alt: string
  images: string[]
}) {
  const [selectedImage, setSelectedImage] = useState<string>("withbear.jpg")

  useEffect(() => {
    if (images.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * images.length)
    setSelectedImage(images[randomIndex])
  }, [images])

  return (
    <div
      className="relative md:col-span-1 animate-in fade-in-0 zoom-in-[0.98] duration-500"
      style={{ animationDelay: "350ms" }}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border/50">
        <Image
          src={withBasePath(`/asset/life-images/${selectedImage}`)}
          alt={alt}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
    </div>
  )
}
