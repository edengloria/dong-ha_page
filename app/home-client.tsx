"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { withBasePath } from "@/lib/utils"
import { PublicationsSection } from "@/components/publications-section"
import { useEffect, useState } from "react"

interface HomeClientProps {
  lifeImages: string[]
}

export default function HomeClient({ lifeImages }: HomeClientProps) {
  const [randomImage, setRandomImage] = useState("withbear.png")

  useEffect(() => {
    if (lifeImages && lifeImages.length > 0) {
      const randomIndex = Math.floor(Math.random() * lifeImages.length)
      setRandomImage(lifeImages[randomIndex])
    }
  }, [lifeImages])

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="page-title mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          About Me
        </motion.h1>

        <motion.div
          className="space-y-10 text-foreground/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="grid gap-8 items-start md:grid-cols-3">
            <div className="md:col-span-2 space-y-5">
              <p className="text-base leading-relaxed">
                I am Dong-Ha Shin, a first-year M.S. student in the{" "}
                <a
                  href="https://www.shbaek.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-300 hover:text-indigo-200 underline underline-offset-4"
                >
                  Computational Imaging Group
                </a>
                , led by{" "}
                <a
                  href="https://www.shbaek.com/team/biography"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-300 hover:text-indigo-200 underline underline-offset-4"
                >
                  Prof. Seung-Hwan Baek
                </a>
                .
              </p>

              <p className="text-base leading-relaxed">
                During my undergraduate studies, I was affiliated with the{" "}
                <a
                  href="https://www.ipodlab.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-300 hover:text-indigo-200 underline underline-offset-4"
                >
                  Integrated Plasmonics and Optical Device Laboratory
                </a>
                , advised by{" "}
                <a
                  href="https://www.ipodlab.com/members-1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-300 hover:text-indigo-200 underline underline-offset-4"
                >
                  Prof. Seung-Yeol Lee
                </a>
                .
              </p>

              <p className="text-base leading-relaxed">
                My research interests broadly lie in co-designing novel systems at the intersection of optics, vision,
                graphics, and artificial intelligence. I believe the multi-dimensional nature of light holds expressive
                power and untapped potential that extend well beyond conventional 2D intensity images.
              </p>

              <p className="text-base leading-relaxed">
                As part of my military service, I led the development of a globally deployed Road-Information-as-a-Service
                (RiaaS)—currently operating in real-world environments across cities including New York City and Seoul—
                encompassing edge-device systems, AI model training, on-device AI deployment, and full web services.
                Additionally, through the{" "}
                <a
                  href="https://www.namuhx.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-300 hover:text-indigo-200 underline underline-offset-4"
                >
                  NamuhX project
                </a>
                , I collaborated with Qualcomm, designing and implementing both an on-device NPU acceleration pipeline and
                a voice-interactive AI agent.
              </p>
            </div>

            <motion.div
              className="relative md:col-span-1"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-border/50">
                <Image
                  src={withBasePath(`/asset/life-images/${randomImage}`)}
                  alt="Dong-Ha Shin"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </motion.div>
          </div>

          <div className="border-t border-border/50 pt-10">
            <PublicationsSection titleClassName="mb-8" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
