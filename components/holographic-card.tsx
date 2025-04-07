"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface HolographicCardProps {
  title: string
  content: string
  slug: string
}

export default function HolographicCard({ title, content, slug }: HolographicCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setMousePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    })
  }

  const calculateRotation = () => {
    if (!isHovered) return { x: 0, y: 0 }

    // Convert percentage to degrees (max 10 degrees rotation)
    const rotateY = ((mousePosition.x - 50) / 50) * 10
    const rotateX = ((50 - mousePosition.y) / 50) * 10

    return { x: rotateX, y: rotateY }
  }

  const rotation = calculateRotation()

  const handleClick = () => {
    router.push(`/sections/${slug}`)
  }

  return (
    <motion.div
      ref={cardRef}
      className="relative h-full cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      style={{
        perspective: "1000px",
      }}
    >
      <motion.div
        className={cn(
          "relative overflow-hidden rounded-xl p-6 h-full",
          "bg-black/30 backdrop-blur-md border border-white/10",
          "transition-all duration-300 ease-out",
        )}
        animate={{
          rotateX: rotation.x,
          rotateY: rotation.y,
          boxShadow: isHovered
            ? "0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.3), inset 0 0 10px rgba(99, 102, 241, 0.2)"
            : "0 10px 30px rgba(0, 0, 0, 0.3), 0 0 10px rgba(99, 102, 241, 0.2)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Holographic gradient overlay */}
        <motion.div
          className="absolute inset-0 opacity-0 mix-blend-overlay pointer-events-none"
          style={{
            background: `linear-gradient(
              ${mousePosition.x}deg,
              rgba(99, 102, 241, 0.5) 0%,
              rgba(168, 85, 247, 0.5) 33%,
              rgba(236, 72, 153, 0.5) 66%,
              rgba(99, 102, 241, 0.5) 100%
            )`,
          }}
          animate={{
            opacity: isHovered ? 0.7 : 0,
          }}
        />

        {/* Card content */}
        <div className="relative z-10">
          <motion.h3
            className="text-xl font-light text-white mb-4 tracking-tight"
            style={{
              textShadow: "0 0 10px rgba(99, 102, 241, 0.3)",
            }}
            animate={{
              textShadow: isHovered ? "0 0 15px rgba(99, 102, 241, 0.5)" : "0 0 10px rgba(99, 102, 241, 0.3)",
            }}
          >
            {title}
          </motion.h3>

          <motion.div
            className="text-white/80 text-sm font-light leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content }}
            animate={{
              opacity: isHovered ? 1 : 0.8,
            }}
          />

          <motion.div
            className="mt-4 text-indigo-400 text-sm flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
          >
            View details
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
