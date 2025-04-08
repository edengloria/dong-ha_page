"use client"

import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ExperiencePage() {
  const experiences = [
    {
      title: "IPOD Lab",
      role: "Research Assistant",
      period: "2020-Present",
      location: "University of Technology",
      description:
        "Developing novel holographic display technologies and computational imaging methods. My work focuses on creating next-generation 3D displays using a combination of custom optics and advanced algorithms.",
      responsibilities: [
        "Lead researcher on the real-time holographic rendering project",
        "Designed and implemented a GPU-accelerated phase retrieval algorithm",
        "Built and calibrated experimental holographic display prototypes",
        "Mentored junior researchers and graduate students",
        "Collaborated with industry partners to develop practical applications",
      ],
      achievements: [
        "Reduced hologram computation time by 80% through algorithm optimization",
        "Published 4 papers in top-tier journals and conferences",
        "Secured $250,000 in additional research funding",
        "Filed 2 patents for novel holographic display techniques",
      ],
    },
    {
      title: "POSTECH CG Lab",
      role: "Graduate Researcher",
      period: "2018-2020",
      location: "Pohang University of Science and Technology",
      description:
        "Worked on computational imaging and rendering algorithms for novel display technologies. Focused on the intersection of computer graphics and optics to create more realistic and immersive visual experiences.",
      responsibilities: [
        "Developed rendering algorithms for light field displays",
        "Implemented and evaluated various phase retrieval methods",
        "Created simulation tools for optical system design",
        "Collaborated with the display engineering team on prototype development",
        "Presented research findings at international conferences",
      ],
      achievements: [
        "Best Paper Award at SIGGRAPH Asia 2019 for work on light field rendering",
        "Developed a novel depth-based rendering technique that improved visual quality by 40%",
        "Created an open-source library for holographic simulation that has been adopted by several research groups",
      ],
    },
    {
      title: "Dareesoft",
      role: "Research Intern",
      period: "Summer 2017",
      location: "Seoul, South Korea",
      description:
        "Worked on augmented reality applications for industrial training and visualization. Explored the use of holographic techniques to enhance AR experiences.",
      responsibilities: [
        "Developed prototype AR applications for industrial training",
        "Researched methods for improving depth perception in AR displays",
        "Collaborated with UX designers to create intuitive interfaces",
        "Participated in user testing and feedback sessions",
      ],
      achievements: [
        "Created a proof-of-concept for holographic AR overlays that was incorporated into the company's product roadmap",
        "Improved rendering performance by 35% through shader optimization",
      ],
    },
  ]

  return (
    <div className="container mx-auto px-4">
      <Link href="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Link>

      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="text-4xl font-light text-white mb-8 tracking-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Research Experience
        </motion.h1>

        <div className="space-y-8">
          {experiences.map((exp, index) => (
            <motion.div
              key={exp.title}
              className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            >
              <div className="mb-4">
                <h2 className="text-2xl font-light text-indigo-400">{exp.title}</h2>
                <p className="text-white font-medium">{exp.role}</p>
                <p className="text-white/70">
                  {exp.period} | {exp.location}
                </p>
              </div>

              <p className="text-white/80 mb-4 leading-relaxed">{exp.description}</p>

              <div className="mb-4">
                <h3 className="text-lg font-light text-white mb-2">Responsibilities:</h3>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  {exp.responsibilities.map((item, i) => (
                    <li key={i} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-light text-white mb-2">Key Achievements:</h3>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  {exp.achievements.map((item, i) => (
                    <li key={i} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
