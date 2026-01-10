"use client"

import { motion } from "framer-motion"

export default function ResearchPage() {
  const researchAreas = [
    {
      title: "Photonics",
      description:
        "My work in photonics focuses on light-matter interactions at the nanoscale. I investigate how nanostructured materials can manipulate light in ways that aren't possible with conventional optics. This includes research on photonic crystals, plasmonic structures, and metamaterials that can control the flow of light with unprecedented precision.",
      keyTopics: [
        "Nanophotonic devices for light manipulation",
        "Quantum photonics and single-photon sources",
        "Integrated photonic circuits",
        "Nonlinear optical phenomena at the nanoscale",
      ],
    },
    {
      title: "Holography",
      description:
        "My holography research centers on computer-generated holography and advanced display systems. I develop algorithms and optical configurations that can generate high-quality holographic images in real-time. This includes work on phase-only spatial light modulators, holographic projection systems, and methods for reducing computational complexity in hologram generation.",
      keyTopics: [
        "Computer-generated holography algorithms",
        "Real-time holographic display systems",
        "Phase retrieval techniques",
        "Holographic optical elements (HOEs)",
        "Volumetric and multi-plane holographic displays",
      ],
    },
    {
      title: "3D Graphics",
      description:
        "In the realm of 3D graphics, I explore real-time rendering techniques and computational imaging methods that can enhance the realism and interactivity of three-dimensional visual content. My work bridges the gap between computer graphics and physical optics, seeking ways to leverage the strengths of both fields for more immersive visual experiences.",
      keyTopics: [
        "Light field rendering and capture",
        "Computational displays",
        "GPU-accelerated hologram generation",
        "Perceptually-optimized rendering for holographic displays",
        "Depth-based rendering techniques",
      ],
    },
    {
      title: "Metasurfaces",
      description:
        "My research on metasurfaces involves designing and characterizing engineered surfaces for wavefront manipulation. These ultrathin optical components can perform complex optical functions that traditionally required bulky elements. I investigate both the fundamental physics of metasurfaces and their applications in imaging, sensing, and display technologies.",
      keyTopics: [
        "Dielectric metasurfaces for wavefront shaping",
        "Dynamic and reconfigurable metasurfaces",
        "Polarization-sensitive metasurface holograms",
        "Metasurface-based optical components",
        "Integration of metasurfaces with conventional optics",
      ],
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="page-title mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        Research Interests
      </motion.h1>

      <div className="space-y-6">
        {researchAreas.map((area, index) => (
          <motion.div
            key={area.title}
            className="glass rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
          >
            <h2 className="text-2xl font-light text-indigo-400 mb-4">{area.title}</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">{area.description}</p>

            <h3 className="text-lg font-light text-foreground mb-2">Key Topics:</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              {area.keyTopics.map((topic, i) => (
                <li key={i} className="leading-relaxed">
                  {topic}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
