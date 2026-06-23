"use client"

import { memo, useState, useMemo, useCallback, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { withBasePath } from "@/lib/utils"
import { GalleryItem } from "@/lib/gallery"

const PhotoCard = memo(function PhotoCard({
  imageId,
  item,
  onOpen,
}: {
  imageId: number
  item: GalleryItem
  onOpen: (imageId: number) => void
}) {
  return (
    <div
      className="group cursor-pointer"
      data-image-id={imageId}
      onClick={(event) => {
        const id = Number((event.currentTarget as HTMLDivElement).dataset.imageId)
        if (!Number.isNaN(id)) {
          onOpen(id)
        }
      }}
    >
      <div className="relative aspect-square rounded-xl overflow-hidden transition-transform duration-200 group-hover:scale-[1.02] group-hover:z-10">
              <Image
                src={withBasePath(item.imageUrl || "/placeholder.svg")}
                alt={`Photo ${item.id}`}
                fill
                className="object-cover"
                loading="lazy"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                decoding="async"
              />
      </div>
    </div>
  )
})

const ITEMS_PER_PAGE = 12

export function PhotoGallery({
  galleryItems,
}: {
  galleryItems: GalleryItem[]
}) {
  const items = useMemo(() => {
    const shuffled = [...galleryItems]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const current = shuffled[i]
      shuffled[i] = shuffled[j]
      shuffled[j] = current
    }
    return shuffled
  }, [galleryItems])
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const [mounted, setMounted] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, items.length))
        }
      },
      { threshold: 0.1 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [items.length])

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount])

  const idToIndex = useMemo(() => {
    const map = new Map<number, number>()
    items.forEach((item, index) => map.set(item.id, index))
    return map
  }, [items])

  const handlePrev = useCallback(() => {
    if (selectedImage === null) return
    const currentIndex = idToIndex.get(selectedImage)
    if (currentIndex === undefined) return

    const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1
    setSelectedImage(items[prevIndex].id)
  }, [selectedImage, idToIndex, items])

  const handleNext = useCallback(() => {
    if (selectedImage === null) return
    const currentIndex = idToIndex.get(selectedImage)
    if (currentIndex === undefined) return

    const nextIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1
    setSelectedImage(items[nextIndex].id)
  }, [selectedImage, idToIndex, items])

  const selectedItem = useMemo(() => {
    if (selectedImage === null) return null
    const index = idToIndex.get(selectedImage)
    return index === undefined ? null : items[index]
  }, [selectedImage, idToIndex, items])

  const currentIndex = useMemo(
    () => (selectedImage === null ? 0 : (idToIndex.get(selectedImage) ?? -1) + 1),
    [selectedImage, idToIndex]
  )

  const handleOpenPhoto = useCallback((imageId: number) => {
    setSelectedImage(imageId)
  }, [])

  const closePhoto = useCallback(() => {
    setSelectedImage(null)
  }, [])

  const handlePrevClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      handlePrev()
    },
    [handlePrev]
  )

  const handleNextClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      handleNext()
    },
    [handleNext]
  )

  const stopOverlayPropagation = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
  }, [])

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {visibleItems.map((item) => (
          <PhotoCard
            key={item.id}
            item={item}
            imageId={item.id}
            onOpen={handleOpenPhoto}
          />
        ))}
      </div>

      {visibleCount < items.length && (
        <div ref={loaderRef} className="py-8 flex justify-center w-full">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-postech-red border-t-postech-gold/60" />
        </div>
      )}

      {mounted &&
        selectedImage !== null &&
        selectedItem &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 animate-in fade-in duration-200"
            onClick={closePhoto}
          >
            <button
              className="absolute right-4 top-4 z-10 rounded-full p-3 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              onClick={closePhoto}
            >
              <X className="h-6 w-6" />
            </button>

            <button
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full p-3 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              onClick={handlePrevClick}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>

            <button
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full p-3 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              onClick={handleNextClick}
            >
              <ChevronRight className="h-8 w-8" />
            </button>

            <div
              className="relative flex h-[85vh] w-full max-w-6xl items-center justify-center p-4"
              onClick={stopOverlayPropagation}
            >
              <Image
                src={withBasePath(selectedItem.imageUrl || "/placeholder.svg")}
                alt={`Photo ${selectedItem.id}`}
                fill
                className="object-contain"
                priority
                sizes="90vw"
                decoding="async"
              />
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/50">
              {currentIndex} / {items.length}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
