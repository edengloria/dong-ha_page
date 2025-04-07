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
      content: `I am a Machine Learning/Optical Engineer at DareeSoft. I am currently fulfilling my national defense duty in South Korea. My work and research combine various fields from digital holography and photonics to on-device AI and computer vision.`,
    },
    {
      id: "research",
      title: "Interests",
      slug: "research",
      content: `
        <ul class="space-y-2">
          <li><span class="text-indigo-400">Holography</span> - Computer-generated holography and display systems</li>
          <li><span class="text-indigo-400">3D Graphics</span> - Real-time rendering and computational imaging</li>
          <li><span class="text-indigo-400">Computer Vision</span> - On-device AI and computer vision</li>
          <li><span class="text-indigo-400">Art</span> - From classical art history to interactive media art</li>
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
            <h4 class="font-medium text-white">PADO : Pytorch Automatic Differentiable Optics</h4>
            <p class="text-sm text-white/70">Open-Source Python Library, 2025</p>
          </div>
          <div>
            <h4 class="font-medium text-white">Hologram Upscaling for Viewing Angle Expansion Using Light Field Extrapolation with Object Detection Algorithm</h4>
            <p class="text-sm text-white/70">Current Optics and Photonics, 2025</p>
          </div>
          <div>
            <h4 class="font-medium text-white">Technique for Interpreting and Adjusting Depth Information of each Plane by Applying an Object Detection Algorithm to Multi-plane Light-field Image Converted from Hologram Image</h4>
            <p class="text-sm text-white/70">Journal of Broadcast Engineering, 2023</p>
          </div>
        </div>
      `,
    },
    {
      id: "experience",
      title: "Experience",
      slug: "experience",
      content: `
        <div class="space-y-4">
          <div>
            <h4 class="font-medium text-white">DareeSoft</h4>
            <p class="text-sm text-white/70">Senior Associate, AI Research, 2024-present</p>
          </div>
          <div>
            <h4 class="font-medium text-white">POSTECH Computer Graphics Laboratory</h4>
            <p class="text-sm text-white/70">Research Engineer, 2024-present</p>
          </div>
          <div>
            <h4 class="font-medium text-white">Kyungpook National University IPOD Lab</h4>
            <p class="text-sm text-white/70">Undergraduate Researcher, 2021-2024</p>
          </div>
                    <div>
            <h4 class="font-medium text-white">Kyungpook National University Video Intelligence Lab</h4>
            <p class="text-sm text-white/70">Intern, 2023</p>
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
            <h4 class="font-medium text-white">Image processing apparatus and method for analyzing hazardous objects on road</h4>
            <p class="text-sm text-white/70">Korea - Application No. 10-2024-0265893</p>
          </div>
          <div>
            <h4 class="font-medium text-white">Communication System Using Extended Reality, And Its Communication Method</h4>
            <p class="text-sm text-white/70">Korea - Application No. 10-2023-0186048</p>
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
            <h4 class="font-medium text-white">2023 Google Solution Challenge: Global Top 100</h4>
            <p class="text-sm text-white/70">Google, 2023</p>
          </div>
          <div>
            <h4 class="font-medium text-white">National University Student Creative Design-Engineering Contest, Grand Prize</h4>
            <p class="text-sm text-white/70">UNIST, 2021</p>
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
          <p>My drawings, travel photos, personal pictures, and experimental photography, etc.</p>
        </div>
      `,
    },
    {
      id: "contact",
      title: "Contact",
      slug: "contact",
      content: `
        <div class="space-y-3">
          <p><span class="text-indigo-400">Email:</span> 0218sdh@gmail.com</p>
          <p><span class="text-indigo-400">Company:</span> DareeSoft</p>
          <p><span class="text-indigo-400">Address:</span> 37 Hwangsaeul-ro, 258 beon-gil, Bundang-gu, Seongnam-si, Gyeonggi-do, Republic of Korea</p>
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
