"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Award } from "lucide-react"
import Link from "next/link"

export default function AwardsPage() {
  const awards = [
    {
      title: "Google Solution Challenge: Global Top 100",
      organization: "Google",
      year: 2023,
      description:
        "Awarded for the project 'Eywa: Invasive species detection and education application' in the Google Solution Challenge 2023.",
      achievement:
        "Developed an innovative application for detecting and educating about invasive species, contributing to environmental conservation efforts.",
      impact:
        "The project was recognized among the top 100 global solutions, showcasing the potential of technology in addressing environmental challenges.",
      link: "https://github.com/GDSC-KNU/2023-eywa-solution-challenge"
    },
    {
      title: "CLUTCH THE ENERGY CAMP, Grand Prize",
      organization: "Korea Gas Corporation",
      year: 2023,
      description:
        "Awarded the grand prize for innovative energy-related project in the CLUTCH THE ENERGY CAMP competition.",
      achievement:
        "Developed a solution addressing energy challenges, demonstrating expertise in energy technology and innovation.",
      impact:
        "The recognition led to potential collaboration opportunities with Korea Gas Corporation and exposure in the energy sector.",
    },
    {
      title: "Career Exploration Capstone Project, Grand Prize",
      organization: "Kyungpook National University",
      year: 2023,
      description:
        "Received the President's Award for outstanding capstone project in career exploration.",
      achievement:
        "Created an innovative solution that bridges academic knowledge with practical career applications.",
      impact:
        "The project demonstrated the ability to apply theoretical knowledge to real-world problems, earning recognition from university leadership.",
    },
    {
      title: "DAEGU METAVERSE CONTEST, 3rd Prize",
      organization: "DIP",
      year: 2023,
      description:
        "Secured third place in the Daegu Metaverse Contest for innovative metaverse applications.",
      achievement:
        "Developed a creative metaverse solution that showcases the potential of virtual environments in various applications.",
      impact:
        "The recognition established expertise in emerging metaverse technologies and potential for future collaborations in this field.",
    },
    {
      title: "Haninum Contest 2022, Winning work",
      organization: "Federation of Korean Information Industries",
      year: 2022,
      description:
        "Awarded for outstanding contribution in the Haninum Contest, a prestigious competition in the Korean IT industry.",
      achievement:
        "Created an innovative solution that addresses significant challenges in the information technology sector.",
      impact:
        "The recognition from FKII established credibility in the Korean IT industry and opened doors for professional opportunities.",
    },
    {
      title: "KNU EE Research Congress, Winning work",
      organization: "Kyungpook National University",
      year: 2022,
      description:
        "Recognized for exceptional research in the Electronic Engineering Research Congress at Kyungpook National University.",
      achievement:
        "Presented innovative research that advances the field of electronic engineering.",
      impact:
        "The award demonstrated research capabilities and academic excellence within the university's electronic engineering department.",
    },
    {
      title: "National University Student Creative Design-Engineering Contest, Grand Prize",
      organization: "UNIST",
      year: 2022,
      description:
        "Awarded the grand prize in the National University Student Creative Design-Engineering Contest organized by UNIST.",
      achievement:
        "Developed an innovative design-engineering solution that stood out among national university submissions.",
      impact:
        "The recognition established expertise in creative engineering design at a national level and potential for future collaborations.",
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
                    
                    {award.link && (
                      <div>
                        <a 
                          href={award.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center"
                        >
                          View Project
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    )}
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
