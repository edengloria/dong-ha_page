"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Download, ExternalLink, Github } from "lucide-react"
import Link from "next/link"

export default function PublicationsPage() {
  const publications = [
    {
      title: "Hologram Upscaling for Viewing Angle Expansion Using Light Field Extrapolation with Object Detection Algorithm",
      journal: "Current Optics and Photonics",
      year: 2025,
      authors: "Shin, D.H., Song, C.H., & Lee, S.Y.",
      abstract:
        "As demand for high-resolution holographic displays in augmented and virtual reality (AR/VR) increases, the limitations of traditional computer-generated holography (CGH) upscaling methods, including bicubic interpolation and deep learning-based techniques, become apparent. These methods predominantly estimate additional pixels without considering the reduction of pixel pitch, inherently constraining their capacity to effectively expand the viewing angle. Our study introduces a novel approach for viewing angle expansion through light field (LF) extrapolation by applying an object detection algorithm. This process starts by analyzing the object position and depth information of each LF view extracted from CGH patterns with the object detection algorithm. The use of these data allows us to extrapolate LF views beyond their initial viewing angle limit. Subsequently, these expanded LF views are resynthesized into the CGH format to expand the viewing angle. With our approach, the viewing angle was successfully doubled from an initial 3.54 degrees to 7.09 degrees by upscaling a 2K 7.2 μm CGH to a 4K 3.6 μm CGH, which was verified with both numerical simulation and optical experiments.",
      doi: "10.1364/COPP.499142",
      url: "https://opg.optica.org/copp/abstract.cfm?URI=copp-9-1-55",
      keywords: ["Augmented reality", "Holographic displays", "Numerical simulation", "Spatial light modulators", "Viewing angles", "Virtual reality"],
    },
    {
      title: "PADO: Pytorch Automatic Differentiable Optics",
      journal: "Open-Source Python Library",
      year: 2025,
      authors: "Baek, S.H., Shin, D.H., Jeon, Y., Yoon, S.W., Choi, E., Ban, G., & Kang, H.",
      abstract:
        "PADO (파도) is a cutting-edge framework for differentiable optical simulations powered by PyTorch. Inspired by the Korean word for 'wave,' PADO enables seamless and fully differentiable simulation workflows, perfect for researchers and developers in optical physics, computational imaging, and beyond. Features include full differentiability with PyTorch Autograd, CUDA acceleration, modular components, visualization tools, and a beginner-friendly API.",
      github: "https://github.com/shwbaek/pado",
      keywords: ["Differentiable optics", "PyTorch", "Optical simulation", "Computational imaging", "Computer-generated holography"],
    },
    {
      title: "A Technique for Interpreting and Adjusting Depth Information of each Plane by Applying an Object Detection Algorithm to Multi-plane Light-field Image Converted from Hologram Image",
      journal: "Journal of Broadcast Engineering",
      year: 2023,
      authors: "Bae, Y.G., Shin, D.H., & Lee, S.Y.",
      abstract:
        "Directly converting the focal depth and image size of computer-generated-hologram (CGH), which is obtained by calculating the interference pattern of light from the 3D image, is known to be quite difficult because of the less similarity between the CGH and the original image. This paper proposes a method for separately converting the each of focal length of the given CGH, which is composed of multi-depth images. Firstly, the proposed technique converts the 3D image reproduced from the CGH into a Light-Field (LF) image composed of a set of 2D images observed from various angles, and the positions of the moving objects for each observed views are checked using an object detection algorithm YOLOv5 (You-Only-Look-Once-version-5). After that, by adjusting the positions of objects, the depth-transformed LF image and CGH are generated. Numerical simulations and experimental results show that the proposed technique can change the focal length within a range of about 3 cm without significant loss of the image quality when applied to the image which have original depth of 10 cm, with a spatial light modulator which has a pixel size of 3.6 ㎛ and a resolution of 3840⨯2160.",
      doi: "10.5909/JBE.2023.28.1.31",
      keywords: ["Computer-generated holography", "Light field", "Object detection", "YOLOv5", "Depth adjustment"],
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
          Publications
        </motion.h1>

        <div className="space-y-6">
          {publications.map((pub, index) => (
            <motion.div
              key={pub.title}
              className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            >
              <h2 className="text-xl font-medium text-white mb-2">{pub.title}</h2>
              <p className="text-indigo-400 mb-2">
                {pub.journal}, {pub.year}
              </p>
              <p className="text-white/70 mb-4 italic">{pub.authors}</p>

              <p className="text-white/80 mb-4 leading-relaxed">{pub.abstract}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {pub.keywords.map((keyword, i) => (
                  <span key={i} className="bg-indigo-900/30 text-indigo-300 text-xs px-2 py-1 rounded-full">
                    {keyword}
                  </span>
                ))}
              </div>

              <div className="flex items-center space-x-4 text-sm">
                {pub.doi && (
                  <a
                    href={`https://doi.org/${pub.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 flex items-center transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    DOI: {pub.doi}
                  </a>
                )}
                {pub.url && (
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 flex items-center transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Publication
                  </a>
                )}
                {pub.github && (
                  <a
                    href={pub.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 flex items-center transition-colors"
                  >
                    <Github className="h-4 w-4 mr-1" />
                    GitHub Repository
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
