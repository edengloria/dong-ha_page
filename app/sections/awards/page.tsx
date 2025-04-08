"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Award } from "lucide-react"
import Link from "next/link"

export default function AwardsPage() {
  const awards = [
    {
      title: "Outstanding Research Award",
      organization: "International Optics Society",
      year: 2023,
      description:
        "Awarded for exceptional contributions to the field of holographic display technology. This prestigious award recognizes researchers who have made significant advancements in optics and photonics with potential for real-world impact.",
      achievement:
        "Recognized for pioneering work in real-time computer-generated holography and the development of novel algorithms that significantly reduce the computational complexity of hologram generation while maintaining high image quality.",
      impact:
        "The research has opened new possibilities for practical holographic displays in consumer applications, bringing this technology closer to widespread adoption.",
    },
    {
      title: "Best Paper Award",
      organization: "SIGGRAPH Asia",
      year: 2021,
      description:
        "Awarded for the paper 'Real-time Hologram Generation Using Neural Networks' which was recognized as the most innovative and impactful contribution to the conference.",
      achievement:
        "Developed a novel approach that combines deep learning with traditional optical principles to generate high-quality holograms at unprecedented speeds, demonstrating a 10x performance improvement over previous state-of-the-art methods.",
      impact:
        "The paper has been cited over 150 times in the first year after publication and has inspired several follow-up research projects in both academia and industry.",
    },
    {
      title: "Young Researcher Grant",
      organization: "National Science Foundation",
      year: 2020,
      description:
        "Competitive grant awarded to promising early-career researchers to pursue innovative research directions in science and engineering.",
      achievement:
        "Secured $350,000 in funding for a three-year project titled 'Next-Generation Holographic Displays: Bridging Computation and Optics' that explores novel approaches to holographic display technology.",
      impact:
        "The grant has enabled the establishment of a dedicated research lab and the recruitment of three graduate students, accelerating progress in holographic display research.",
    },
    {
      title: "Innovation in Optics Prize",
      organization: "Asian Society for Optical Engineering",
      year: 2019,
      description:
        "Annual award recognizing innovative applications of optical principles that demonstrate potential for significant technological advancement.",
      achievement:
        "Developed a novel optical configuration for holographic displays that reduces system complexity while improving image quality, particularly in terms of color reproduction and viewing angle.",
      impact:
        "The technology has been patented and is currently being explored for commercialization through a university spin-off venture.",
    },
    {
      title: "Graduate Research Excellence Award",
      organization: "Pohang University of Science and Technology",
      year: 2018,
      description:
        "Institutional award recognizing outstanding research achievements by graduate students across all departments.",
      achievement:
        "Selected from over 200 nominees for contributions to computational imaging and holography, particularly for work on efficient phase retrieval algorithms.",
      impact:
        "The recognition led to additional institutional funding and collaborative opportunities with industry partners interested in display technology.",
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
          Awards & Recognition
        </motion.h1>

        <div className="space-y-6">
          {awards.map((award, index) => (
            <motion.div
              key={award.title}
              className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            >
              <div className="flex items-start">
                <Award className="h-6 w-6 text-indigo-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-medium text-white mb-1">{award.title}</h2>
                  <p className="text-indigo-400 mb-4">
                    {award.organization}, {award.year}
                  </p>

                  <p className="text-white/80 mb-4 leading-relaxed">{award.description}</p>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-light text-white mb-1">Achievement</h3>
                      <p className="text-white/80 leading-relaxed">{award.achievement}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-light text-white mb-1">Impact</h3>
                      <p className="text-white/80 leading-relaxed">{award.impact}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
