"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { withBasePath } from "@/lib/utils"
import { GalleryItem } from "@/lib/gallery"

// Photo Card component
const PhotoCard = ({ 
  item, 
  index, 
  onClick 
}: { 
  item: GalleryItem
  index: number
  onClick: () => void 
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className="cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * (index % 12), duration: 0.3 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        position: "relative",
        zIndex: isHovered ? 50 : 1,
      }}
    >
      <motion.div
        className="relative aspect-square rounded-xl overflow-hidden"
        animate={{
          scale: isHovered ? 1.05 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Image
          src={withBasePath(item.imageUrl || "/placeholder.svg")}
          alt={`Photo ${item.id}`}
          fill
          className="object-cover"
          loading="lazy"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </motion.div>
    </motion.div>
  )
}

const ITEMS_PER_PAGE = 24

export default function PhotosClient({ 
  galleryItems 
}: { 
  galleryItems: GalleryItem[] 
}) {
  const [items, setItems] = useState<GalleryItem[]>(galleryItems)
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const [mounted, setMounted] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Shuffle items on client-side mount
  useEffect(() => {
    const shuffled = [...galleryItems]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setItems(shuffled)
  }, [galleryItems])

  // Infinite scroll
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

  const handlePrev = useCallback(() => {
    if (selectedImage === null) return
    const currentIndex = items.findIndex(item => item.id === selectedImage)
    const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1
    setSelectedImage(items[prevIndex].id)
  }, [selectedImage, items])

  const handleNext = useCallback(() => {
    if (selectedImage === null) return
    const currentIndex = items.findIndex(item => item.id === selectedImage)
    const nextIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1
    setSelectedImage(items[nextIndex].id)
  }, [selectedImage, items])

  const selectedItem = useMemo(() => 
    selectedImage !== null ? items.find((item) => item.id === selectedImage) : null,
    [selectedImage, items]
  )
  
  const currentIndex = useMemo(() => 
    selectedImage !== null ? items.findIndex(item => item.id === selectedImage) + 1 : 0,
    [selectedImage, items]
  )

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        {visibleItems.map((item, index) => (
          <PhotoCard
            key={item.id}
            item={item}
            index={index}
            onClick={() => setSelectedImage(item.id)}
          />
        ))}
      </div>
      
      {/* Loading trigger */}
      {visibleCount < items.length && (
        <div ref={loaderRef} className="py-8 flex justify-center w-full">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      )}

      {/* Lightbox - rendered via portal to escape transform context */}
      {mounted && createPortal(
        <AnimatePresence>
          {selectedImage !== null && selectedItem && (
            <motion.div
              className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
            >
              <button
                className="absolute top-4 right-4 text-white/60 hover:text-white p-3 z-10 rounded-full hover:bg-white/10 transition-colors"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-6 w-6" />
              </button>

              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-3 z-10 rounded-full hover:bg-white/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrev()
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </button>

              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-3 z-10 rounded-full hover:bg-white/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  handleNext()
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </button>

              <div
                className="relative w-full max-w-6xl h-[85vh] flex items-center justify-center p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={withBasePath(selectedItem.imageUrl || "/placeholder.svg")}
                  alt={`Photo ${selectedItem.id}`}
                  fill
                  className="object-contain"
                  priority
                  sizes="90vw"
                />
              </div>

              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
                {currentIndex} / {items.length}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
