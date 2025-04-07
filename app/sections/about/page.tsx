"use client"

import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4">
      <Link href="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Link>

      <motion.div
        className="max-w-3xl mx-auto bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="text-4xl font-light text-white mb-6 tracking-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          About Me
        </motion.h1>

        <motion.div
          className="space-y-6 text-white/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <p className="leading-relaxed">
              I'm a researcher specializing in photonics and holography, with a focus on developing next-generation 3D
              imaging technologies. My work bridges the gap between theoretical physics and practical applications,
              exploring how light can be manipulated to create immersive visual experiences.
            </p>

            <motion.div className="relative">
              <motion.img
                src="/asset/gradshot.jpg"
                alt="Graduation photo"
                className="rounded-lg w-full shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              />
            </motion.div>
          </div>

          <p className="leading-relaxed">
            My journey in the field of optics began during my undergraduate studies, where I was fascinated by the
            fundamental principles of wave optics and interference patterns. This interest evolved into a passion for
            holography when I realized the potential of wavefront manipulation to create true three-dimensional visual
            representations.
          </p>

          <p className="leading-relaxed">
            Currently, my research focuses on the intersection of computational optics, nanophotonics, and display
            technologies. I'm particularly interested in developing novel algorithms and optical systems that can
            generate high-quality, real-time holographic content for applications in augmented reality, scientific
            visualization, and entertainment.
          </p>

          <p className="leading-relaxed">
            Beyond my academic pursuits, I'm an advocate for interdisciplinary collaboration. I believe that the most
            innovative solutions emerge when expertise from different fields converges. This philosophy has led me to
            work with computer scientists, electrical engineers, and even artists to explore new possibilities in
            holographic display technology.
          </p>

          <p className="leading-relaxed">
            When I'm not in the lab, you might find me experimenting with DIY holography setups, attending optics
            conferences, or exploring the latest developments in computational imaging. I'm always open to discussions
            about potential collaborations or simply sharing ideas about the future of visual technology.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
