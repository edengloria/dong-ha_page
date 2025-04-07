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
            I am a Machine Learning/Optical Engineer at DareeSoft, currently fulfilling my national defense duty in South Korea. 
            My work and research combine various fields from digital holography and photonics to on-device AI and computer vision.
            </p>

            <motion.div className="relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="relative w-full aspect-square flex items-center justify-center"
              >
                <img
                  src="/dong-ha_page/asset/gradshot.jpg"
                  alt="Graduation photo"
                  className="rounded-lg object-contain shadow-lg max-h-full max-w-full"
                  onError={(e) => {
                    console.error('Image failed to load');
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // Prevent infinite error loop
                    target.src = "/fallback-image.png"; // Optional fallback
                  }}
                />
              </motion.div>
            </motion.div>
          </div>

          <p className="leading-relaxed">
          I graduated from the Department of Electronic Engineering at Kyungpook National University in March 2024, having enrolled in February 2020. 
          I maintained a GPA of 4.12/4.5 and minored in Computer Engineering. 
          During my undergraduate years, I served as the leader of BITDOL (Hardware Research Group), 
          where I secured funding of 55M KRW(~40,000 USD) and oversaw various projects. 
          Through these experiences, I developed extensive expertise in designing and prototyping diverse embedded systems.
          </p>

          <p className="leading-relaxed">
          My journey in the field of optics began as an undergraduate in Professor Seung-Yeol Lee's Integrated Plasmonic Optical Device (IPOD) Laboratory, 
          where I was fascinated by the fundamental principles of wave optics and interference patterns. 
          This interest evolved into a passion for holography when I realized the potential of wavefront manipulation to create true three-dimensional visual representations.
          </p>

          <p className="leading-relaxed">
          Currently, my research focuses on the intersection of computational optics, nanophotonics, and display technologies. 
          I'm particularly interested in developing novel algorithms and optical systems that can generate high-quality, 
          real-time holographic content for applications in augmented reality, scientific visualization, and entertainment.
          </p>

          <p className="leading-relaxed">
          Beyond my academic pursuits, I'm an advocate for interdisciplinary collaboration. 
          I believe that the most innovative solutions emerge when expertise from different fields converges. 
          This philosophy has led me to work with computer scientists, electrical engineers, and even artists to explore new possibilities.
          </p>

          <p className="leading-relaxed">
          My hobbies include drawing, media art, collecting vinyl LPs, and visiting exhibitions. 
          Feel free to reach out if you'd like to chat over coffee!
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
