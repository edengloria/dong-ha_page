"use client"

import { motion } from "framer-motion"

export default function ExperiencePage() {
  const experiences = [
    {
      title: "DareeSoft",
      role: "Senior Associate, AI Research",
      period: "January 2025 - Present",
      location: "Seongnam, Gyeonggi-do, South Korea",
      description:
        "Working on edge AI and camera engineering solutions, focusing on efficient vision models and hardware-specific optimizations.",
      responsibilities: [
        "Developing efficient vision models for road hazard detection: from large-scale training to edge deployment optimization",
        "Specializing in AI model porting and acceleration for edge devices leveraging hardware-specific optimizations",
        "Developing advanced camera engineering solutions and vision processing pipelines",
        "Led development of on-device STT-LLM-TTS AI system showcased at CES 2025, achieving ~1.5s latency by leveraging NPU on Qualcomm's entry-level SoC",
      ],
    },
    {
      title: "DareeSoft",
      role: "AI Research Scientist",
      period: "February 2024 - December 2024",
      location: "Seongnam, Gyeonggi-do, South Korea",
      description:
        "Fulfilling mandatory military service in the IT sector as part of the Advanced Development Team.",
      responsibilities: [
        "Working on deep learning projects and AI model development",
        "Contributing to the company's advanced development initiatives",
        "Collaborating with team members on research and implementation",
      ],
    },
    {
      title: "Kyungpook National University",
      role: "Undergraduate Researcher",
      period: "September 2021 - February 2024",
      location: "Daegu, South Korea",
      description:
        "Research at IPOD (Integrated Plasmonics and Optical Device) Lab under the guidance of Prof. Seung-Yeol Lee.",
      responsibilities: [
        "Participated in research project on Holo-TV, ETRI (using MATLAB, PyTorch)",
        "Developed CGH (Computer Generated Holography) optimization model based on gradient descent method and Genetic Algorithm",
        "Implemented Light Field Object Depth Transformation Using Object Detection Algorithm",
        "Analyzed nano-scale optical devices such as metasurface with RCWA, Lumerical FDTD",
        "Gained experience with various optical table experimental setups",
      ],
    },
    {
      title: "Kyungpook National University",
      role: "Undergraduate Research Assistant",
      period: "July 2023 - August 2023",
      location: "Daegu, South Korea",
      description:
        "Research at Video Intelligence Lab under the guidance of Prof. Sang-hyo Park.",
      responsibilities: [
        "Researched on light-weighting MotionBERT (3D pose estimation) deep learning model",
        "Contributed to model optimization and implementation",
      ],
    },
    {
      title: "Pohang University of Science and Technology (POSTECH)",
      role: "Undergraduate Researcher",
      period: "January 2023 - September 2023",
      location: "Pohang, Gyeongbuk, South Korea",
      description:
        "Research at Computer Graphics Lab under the guidance of Prof. Seung-Hwan Beak.",
      responsibilities: [
        "Developed differentiable light-wave simulation and optimization for CGH, diffractive optics",
        "Contributed to research on computational imaging and rendering algorithms",
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
        Experience
      </motion.h1>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-500/20 hidden md:block" />

        <div className="space-y-6">
          {experiences.map((exp, index) => (
            <motion.div
              key={`${exp.title}-${exp.period}`}
              className="relative md:pl-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            >
              {/* Timeline dot */}
              <div className="absolute left-2 top-6 w-4 h-4 rounded-full bg-indigo-500 border-2 border-indigo-300 hidden md:block" />

              <div className="glass rounded-xl p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-medium text-indigo-400">{exp.title}</h2>
                  <p className="text-foreground font-medium">{exp.role}</p>
                  <p className="text-muted-foreground text-sm">
                    {exp.period} • {exp.location}
                  </p>
                </div>

                <p className="text-muted-foreground mb-4 leading-relaxed">{exp.description}</p>

                <div>
                  <h3 className="text-sm font-medium text-foreground/90 mb-2">Key Responsibilities:</h3>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1 text-sm">
                    {exp.responsibilities.map((item, i) => (
                      <li key={i} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
