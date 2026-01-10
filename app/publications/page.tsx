"use client"

import { motion } from "framer-motion"
import { PublicationsSection } from "@/components/publications-section"

export default function PublicationsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <PublicationsSection className="space-y-6" titleClassName="mb-8" />
    </motion.div>
  )
}
