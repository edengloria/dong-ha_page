"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export default function HomePage() {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="text-3xl lg:text-4xl font-light text-white mb-6 tracking-tight"
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
          <div className="grid md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 space-y-4">
              <p className="leading-relaxed text-lg">
                I am a Machine Learning/Optical Engineer at <span className="text-indigo-400 font-medium">DareeSoft</span>, currently fulfilling my national defense duty in South Korea. 
                My work and research combine various fields from digital holography and photonics to on-device AI and computer vision.
              </p>
            </div>

            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-white/10">
                <Image
                  src="/asset/gradshot.jpg"
                  alt="Graduation photo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </motion.div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h2 className="text-xl font-medium text-white mb-4">Education</h2>
            <p className="leading-relaxed">
              I graduated from the Department of Electronic Engineering at <span className="text-indigo-400">Kyungpook National University</span> in March 2024, having enrolled in February 2020. 
              I maintained a GPA of <span className="text-white font-medium">4.12/4.5</span> and minored in Computer Engineering. 
              During my undergraduate years, I served as the leader of <span className="text-indigo-400">BITDOL</span> (Hardware Research Group), 
              where I secured funding of 55M KRW (~40,000 USD) and oversaw various projects. 
              Through these experiences, I developed extensive expertise in designing and prototyping diverse embedded systems.
            </p>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h2 className="text-xl font-medium text-white mb-4">Research Journey</h2>
            <p className="leading-relaxed">
              My journey in the field of optics began as an undergraduate in Professor Seung-Yeol Lee's <span className="text-indigo-400">Integrated Plasmonic Optical Device (IPOD) Laboratory</span>, 
              where I was fascinated by the fundamental principles of wave optics and interference patterns. 
              This interest evolved into a passion for holography when I realized the potential of wavefront manipulation to create true three-dimensional visual representations.
            </p>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h2 className="text-xl font-medium text-white mb-4">Current Focus</h2>
            <p className="leading-relaxed">
              Currently, my research focuses on the intersection of computational optics, nanophotonics, and display technologies. 
              I'm particularly interested in developing novel algorithms and optical systems that can generate high-quality, 
              real-time holographic content for applications in augmented reality, scientific visualization, and entertainment.
            </p>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h2 className="text-xl font-medium text-white mb-4">Interests & Hobbies</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                <h3 className="text-indigo-400 font-medium mb-2">Research Interests</h3>
                <ul className="space-y-1 text-sm">
                  <li>• Holography & 3D Displays</li>
                  <li>• Computer Vision & On-device AI</li>
                  <li>• Computational Imaging</li>
                  <li>• Photonics & Nanophotonics</li>
                </ul>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                <h3 className="text-indigo-400 font-medium mb-2">Personal Interests</h3>
                <ul className="space-y-1 text-sm">
                  <li>• Drawing & Visual Arts</li>
                  <li>• Media Art & Interactive Installations</li>
                  <li>• Collecting Vinyl LPs</li>
                  <li>• Visiting Exhibitions</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <p className="leading-relaxed text-white/60 italic">
              Beyond my academic pursuits, I'm an advocate for interdisciplinary collaboration. 
              I believe that the most innovative solutions emerge when expertise from different fields converges. 
              Feel free to reach out if you'd like to chat over coffee!
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
