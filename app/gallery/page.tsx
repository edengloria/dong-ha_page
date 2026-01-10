"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Info, Construction } from "lucide-react"
import Image from "next/image"

export default function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [showInfo, setShowInfo] = useState(false)

  const galleryItems = [
    {
      id: 1,
      title: "Holographic Display Prototype",
      description:
        "Our latest holographic display prototype capable of rendering full-color 3D images with a 45-degree viewing angle. This system uses a custom-designed spatial light modulator and proprietary phase retrieval algorithms.",
      category: "Hardware",
      date: "2023-05",
      imageUrl: "/placeholder.svg",
    },
    {
      id: 2,
      title: "Metasurface Nanofabrication",
      description:
        "Scanning electron microscope image of our fabricated metasurface consisting of titanium dioxide nanopillars on a glass substrate. These structures are designed to manipulate the phase of incident light with subwavelength precision.",
      category: "Nanophotonics",
      date: "2022-11",
      imageUrl: "/placeholder.svg",
    },
    {
      id: 3,
      title: "Neural Holography Results",
      description:
        "Comparison between target images (left) and reconstructed holograms (right) using our neural network approach. The network was trained on a dataset of 10,000 image-hologram pairs to predict optimal phase patterns.",
      category: "Computational",
      date: "2022-08",
      imageUrl: "/placeholder.svg",
    },
    {
      id: 4,
      title: "IPOD Lab Setup",
      description:
        "The optical bench setup in our lab featuring lasers, spatial light modulators, and custom-designed optical components for holographic experiments. This configuration allows for rapid prototyping of new display concepts.",
      category: "Lab",
      date: "2021-12",
      imageUrl: "/placeholder.svg",
    },
    {
      id: 5,
      title: "Holographic Projection Demo",
      description:
        "Live demonstration of our holographic projection system at SIGGRAPH Asia 2021. The system projects 3D content that appears to float in mid-air without requiring special glasses or headsets.",
      category: "Demonstration",
      date: "2021-12",
      imageUrl: "/placeholder.svg",
    },
    {
      id: 6,
      title: "Phase Pattern Visualization",
      description:
        "Visualization of the computed phase patterns used in our computer-generated holograms. The colors represent different phase delays applied to the incident light, creating constructive and destructive interference that forms the desired image.",
      category: "Computational",
      date: "2021-09",
      imageUrl: "/placeholder.svg",
    },
  ]

  const handlePrev = () => {
    if (selectedImage === null) return
    setSelectedImage(selectedImage === 1 ? galleryItems.length : selectedImage - 1)
  }

  const handleNext = () => {
    if (selectedImage === null) return
    setSelectedImage(selectedImage === galleryItems.length ? 1 : selectedImage + 1)
  }

  const selectedItem = selectedImage !== null ? galleryItems.find((item) => item.id === selectedImage) : null
  const categories = Array.from(new Set(galleryItems.map((item) => item.category)))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Under Construction Banner */}
      <motion.div 
        className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Construction className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <h2 className="text-xl font-medium text-yellow-500 mb-2">
          Under Construction
        </h2>
        <p className="text-muted-foreground text-sm">
          Gallery page is currently being built. Check back soon!
        </p>
      </motion.div>

      <motion.h1
        className="page-title mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        Research Gallery
      </motion.h1>

      <motion.p
        className="text-muted-foreground mb-6 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Visual documentation of research projects, experimental setups, and holographic displays. 
        Click on any image to view it in detail.
      </motion.p>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button className="bg-indigo-600/80 text-white text-xs px-3 py-1 rounded-full hover:bg-indigo-500 transition-colors">
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            className="bg-background/20 text-muted-foreground text-xs px-3 py-1 rounded-full hover:bg-indigo-600/30 transition-colors"
          >
            {category}
          </button>
        ))}
      </div>

      {/* Gallery grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {galleryItems.map((item) => (
          <motion.div
            key={item.id}
            className="glass rounded-xl overflow-hidden group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + item.id * 0.05, duration: 0.5 }}
            whileHover={{ y: -5 }}
            onClick={() => setSelectedImage(item.id)}
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={item.imageUrl || "/placeholder.svg"}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <div>
                  <h3 className="text-white font-medium text-sm">{item.title}</h3>
                  <p className="text-white/70 text-xs">{item.category}</p>
                </div>
              </div>
            </div>
            <div className="p-3">
              <span className="text-indigo-400 text-xs">{item.date}</span>
              <h3 className="text-foreground font-medium text-sm mt-1">{item.title}</h3>
              <p className="text-muted-foreground/90 text-xs mt-1 line-clamp-2">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage !== null && selectedItem && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-10"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
            </button>

            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 z-10"
              onClick={(e) => {
                e.stopPropagation()
                handlePrev()
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>

            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 z-10"
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </button>

            <div
              className="relative w-full max-w-5xl max-h-[80vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-[70vh]">
                <Image
                  src={selectedItem.imageUrl || "/placeholder.svg"}
                  alt={selectedItem.title}
                  fill
                  className="object-contain"
                />
              </div>

              <div className="w-full bg-black/50 p-4 flex justify-between items-start">
                <div>
                  <h3 className="text-white text-xl font-medium">{selectedItem.title}</h3>
                  <p className="text-indigo-400 text-sm">
                    {selectedItem.category} | {selectedItem.date}
                  </p>
                </div>
                <button
                  className="text-white/80 hover:text-white p-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowInfo(!showInfo)
                  }}
                >
                  <Info className="h-5 w-5" />
                </button>
              </div>

              {showInfo && (
                <div className="w-full bg-black/70 p-4 text-white/80">
                  <p>{selectedItem.description}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
