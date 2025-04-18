"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface HolographicCardProps {
  title: string
  content: string
  slug: string
  reducedMotion?: boolean
  reducedGraphics?: boolean
  hideViewDetails?: boolean
  disableClick?: boolean
}

export default function HolographicCard({ 
  title, 
  content, 
  slug, 
  reducedMotion = false, 
  reducedGraphics = false,
  hideViewDetails = false,
  disableClick = false
}: HolographicCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  
  // Determine if we should use full effects
  const shouldReduceMotion = reducedMotion || prefersReducedMotion
  const shouldReduceGraphics = reducedGraphics || prefersReducedMotion
  
  // Use a more efficient event handler with throttling
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || shouldReduceMotion) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Update position less frequently for better performance
    requestAnimationFrame(() => {
      setMousePosition({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
      })
    })
  }

  const calculateRotation = () => {
    if (!isHovered || shouldReduceMotion) return { x: 0, y: 0 }

    // Convert percentage to degrees (max 15 degrees rotation)
    const rotateY = ((mousePosition.x - 50) / 50) * 15
    const rotateX = ((50 - mousePosition.y) / 50) * 15

    return { x: rotateX, y: rotateY }
  }

  const rotation = calculateRotation()

  const handleClick = () => {
    if (!disableClick) {
      router.push(`/sections/${slug}`)
    }
  }

  // Simplified shadow for better performance
  const boxShadow = isHovered 
    ? shouldReduceGraphics
      ? "0 10px 30px rgba(0, 0, 0, 0.4)"
      : "0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.3)"
    : "0 10px 30px rgba(0, 0, 0, 0.3)"

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative h-full",
        disableClick ? "cursor-default" : "cursor-pointer"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={shouldReduceMotion ? undefined : handleMouseMove}
      onClick={handleClick}
      style={{
        perspective: shouldReduceMotion ? "none" : "1000px",
      }}
    >
      <motion.div
        className={cn(
          "relative overflow-hidden rounded-xl p-6 h-full will-change-transform",
          "bg-black/30 backdrop-blur-md border border-white/10",
          "transition-all duration-300 ease-out",
        )}
        animate={{
          rotateX: rotation.x,
          rotateY: rotation.y,
          boxShadow,
        }}
        transition={{ 
          type: "spring", 
          stiffness: shouldReduceMotion ? 500 : 300, 
          damping: shouldReduceMotion ? 30 : 20 
        }}
      >
        {/* Holographic gradient overlay - only shown when not in reduced graphics mode */}
        {!shouldReduceGraphics && (
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
        )}

        {/* Card content */}
        <div className="relative z-10">
          <motion.h3
            className="text-xl font-light text-white mb-4 tracking-tight"
            style={{
              textShadow: "0 0 10px rgba(99, 102, 241, 0.3)",
            }}
            animate={{
              textShadow: isHovered && !shouldReduceGraphics 
                ? "0 0 15px rgba(99, 102, 241, 0.5)" 
                : "0 0 10px rgba(99, 102, 241, 0.3)",
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

          {!hideViewDetails && (
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
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
