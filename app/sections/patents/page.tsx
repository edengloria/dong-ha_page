"use client"

import { motion } from "framer-motion"
import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"

export default function PatentsPage() {
  const patents = [
    {
      title: "Method for Generating Computer Holograms",
      number: "US Patent #10,123,456",
      year: 2022,
      inventors: "Shin, D.H., Park, J., & Kim, S.",
      abstract:
        "A method for generating computer holograms using a novel phase retrieval algorithm that significantly reduces computation time while maintaining high image quality. The method employs a hybrid approach combining iterative and neural network-based techniques to achieve optimal results for real-time holographic displays.",
      claims: [
        "A method for generating computer holograms comprising steps of: receiving a target image; preprocessing the target image to extract depth information; applying a neural network to predict an initial phase pattern; refining the phase pattern using an iterative algorithm; and outputting the final hologram.",
        "The method of claim 1, wherein the neural network is trained on a dataset of paired images and corresponding optimal phase patterns.",
        "The method of claim 1, wherein the iterative algorithm employs a perceptually-weighted error metric to prioritize visually significant regions.",
      ],
      applications: [
        "Real-time holographic displays",
        "Augmented reality headsets",
        "Holographic projection systems",
        "Medical visualization",
      ],
    },
    {
      title: "Optical System for 3D Holographic Displays",
      number: "KR Patent #20-1234567",
      year: 2021,
      inventors: "Lee, K., Shin, D.H., & Cho, M.",
      abstract:
        "An optical system for 3D holographic displays that uses a novel arrangement of spatial light modulators and custom optical elements to achieve wide viewing angles and high image quality. The system incorporates polarization management and pupil tracking to optimize the viewing experience.",
      claims: [
        "An optical system for 3D holographic displays comprising: at least one spatial light modulator; a polarization management subsystem; a custom diffractive optical element; and a pupil tracking system that adjusts the hologram based on viewer position.",
        "The optical system of claim 1, wherein the polarization management subsystem includes a quarter-wave plate and a polarizing beamsplitter.",
        "The optical system of claim 1, wherein the diffractive optical element is designed to correct for aberrations in the optical path.",
      ],
      applications: [
        "Head-mounted displays",
        "Automotive head-up displays",
        "Medical imaging systems",
        "Entertainment and gaming",
      ],
    },
    {
      title: "Metasurface Design for Holographic Projection",
      number: "US Patent Application #17/123,456",
      year: 2023,
      status: "Pending",
      inventors: "Shin, D.H., Wang, L., & Garcia, M.",
      abstract:
        "A novel metasurface design for holographic projection that achieves high efficiency and color fidelity. The metasurface incorporates nanopillars with varying geometries to control the phase, amplitude, and polarization of light with subwavelength precision.",
      claims: [
        "A metasurface for holographic projection comprising: a substrate; and an array of nanopillars with varying geometries arranged to modulate the phase and amplitude of incident light to produce a predetermined holographic image.",
        "The metasurface of claim 1, wherein the nanopillars are composed of titanium dioxide on a glass substrate.",
        "The metasurface of claim 1, wherein the arrangement of nanopillars is determined using a topology optimization algorithm.",
      ],
      applications: ["Compact projectors", "Security holograms", "Wearable displays", "Optical sensors"],
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
          Patents
        </motion.h1>

        <div className="space-y-6">
          {patents.map((patent, index) => (
            <motion.div
              key={patent.title}
              className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            >
              <div className="flex items-start">
                <FileText className="h-6 w-6 text-indigo-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-medium text-white mb-1">{patent.title}</h2>
                  <p className="text-indigo-400 mb-1">
                    {patent.number}, {patent.year}
                    {patent.status && <span className="ml-2 text-yellow-400">({patent.status})</span>}
                  </p>
                  <p className="text-white/70 mb-4 italic">Inventors: {patent.inventors}</p>

                  <div className="mb-4">
                    <h3 className="text-lg font-light text-white mb-2">Abstract</h3>
                    <p className="text-white/80 leading-relaxed">{patent.abstract}</p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-light text-white mb-2">Key Claims</h3>
                    <ul className="list-decimal pl-5 text-white/80 space-y-2">
                      {patent.claims.map((claim, i) => (
                        <li key={i} className="leading-relaxed">
                          {claim}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-light text-white mb-2">Applications</h3>
                    <div className="flex flex-wrap gap-2">
                      {patent.applications.map((app, i) => (
                        <span key={i} className="bg-indigo-900/30 text-indigo-300 text-xs px-2 py-1 rounded-full">
                          {app}
                        </span>
                      ))}
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
