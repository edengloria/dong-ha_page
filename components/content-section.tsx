"use client"

import { motion } from "framer-motion"
import { useRef } from "react"
import HolographicCard from "@/components/holographic-card"

export default function ContentSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  const sections = [
    {
      id: "about",
      title: "About Me",
      slug: "about",
      content: `I'm a researcher specializing in photonics and holography, with a focus on developing next-generation 3D imaging technologies. My work bridges the gap between theoretical physics and practical applications, exploring how light can be manipulated to create immersive visual experiences.`,
    },
    {
      id: "research",
      title: "Research Interests",
      slug: "research",
      content: `
        <ul class="space-y-2">
          <li><span class="text-indigo-400">Photonics</span> - Light-matter interactions at the nanoscale</li>
          <li><span class="text-indigo-400">Holography</span> - Computer-generated holography and display systems</li>
          <li><span class="text-indigo-400">3D Graphics</span> - Real-time rendering and computational imaging</li>
          <li><span class="text-indigo-400">Metasurfaces</span> - Engineered surfaces for wavefront manipulation</li>
        </ul>
      `,
    },
    {
      id: "publications",
      title: "Publications",
      slug: "publications",
      content: `
        <div class="space-y-4">
          <div>
            <h4 class="font-medium text-white">Advances in Computer-Generated Holography for 3D Displays</h4>
            <p class="text-sm text-white/70">Journal of Optics & Photonics, 2023</p>
          </div>
          <div>
            <h4 class="font-medium text-white">Metasurface-based Holographic Projections</h4>
            <p class="text-sm text-white/70">Nature Photonics, 2022</p>
          </div>
        </div>
      `,
    },
    {
      id: "experience",
      title: "Research Experience",
      slug: "experience",
      content: `
        <div class="space-y-4">
          <div>
            <h4 class="font-medium text-white">IPOD Lab</h4>
            <p class="text-sm text-white/70">Research Assistant, 2020-Present</p>
          </div>
          <div>
            <h4 class="font-medium text-white">POSTECH CG Lab</h4>
            <p class="text-sm text-white/70">Graduate Researcher, 2018-2020</p>
          </div>
        </div>
      `,
    },
    {
      id: "patents",
      title: "Patents",
      slug: "patents",
      content: `
        <div class="space-y-3">
          <div>
            <h4 class="font-medium text-white">Method for Generating Computer Holograms</h4>
            <p class="text-sm text-white/70">US Patent #10,123,456, 2022</p>
          </div>
          <div>
            <h4 class="font-medium text-white">Optical System for 3D Holographic Displays</h4>
            <p class="text-sm text-white/70">KR Patent #20-1234567, 2021</p>
          </div>
        </div>
      `,
    },
    {
      id: "awards",
      title: "Awards",
      slug: "awards",
      content: `
        <div class="space-y-3">
          <div>
            <h4 class="font-medium text-white">Outstanding Research Award</h4>
            <p class="text-sm text-white/70">International Optics Society, 2023</p>
          </div>
          <div>
            <h4 class="font-medium text-white">Best Paper Award</h4>
            <p class="text-sm text-white/70">SIGGRAPH Asia, 2021</p>
          </div>
        </div>
      `,
    },
    {
      id: "gallery",
      title: "Gallery",
      slug: "gallery",
      content: `
        <div class="space-y-3">
          <p>Visual showcase of research projects, experimental setups, and holographic displays.</p>
          <div class="grid grid-cols-2 gap-2 mt-2">
            <div class="bg-indigo-900/30 aspect-square rounded-md"></div>
            <div class="bg-indigo-900/30 aspect-square rounded-md"></div>
          </div>
        </div>
      `,
    },
    {
      id: "contact",
      title: "Contact",
      slug: "contact",
      content: `
        <div class="space-y-3">
          <p><span class="text-indigo-400">Email:</span> dongha.shin@research.edu</p>
          <p><span class="text-indigo-400">Lab:</span> IPOD Laboratory, Room 301</p>
          <p><span class="text-indigo-400">Address:</span> Department of Photonics, University of Technology</p>
        </div>
      `,
    },
  ]

  return (
    <div className="container mx-auto px-4 py-20" ref={containerRef}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            id={section.id}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <HolographicCard title={section.title} content={section.content} slug={section.slug} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
