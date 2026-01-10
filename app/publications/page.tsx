"use client"

import { motion } from "framer-motion"
import { ExternalLink } from "lucide-react"
import Image from "next/image"
import { withBasePath } from "@/lib/utils"

export default function PublicationsPage() {
  const publications = [
    {
      kind: "Open-source",
      title: "PADO: PyTorch Automatic Differentiable Optics",
      authors: "POSTECH Computational Imaging Group",
      venue: "2025",
      note: "Lead developer and main maintainer",
      image: "/asset/pado.png",
      links: [
        { label: "Code", href: "https://github.com/shwbaek/pado" },
        { label: "Document", href: "https://github.com/shwbaek/pado#readme" },
      ],
    },
    {
      kind: "Journals",
      title: "Complex-Valued Holographic Radiance Fields",
      authors: "Yicheng Zhan, Dong-Ha Shin, Seung-Hwan Baek, and Kaan Akşit",
      venue: "arXiv 2025 (under review)",
      image: "/placeholder.jpg",
      links: [
        {
          label: "Paper",
          href: "https://arxiv.org/search/?query=Complex-Valued%20Holographic%20Radiance%20Fields&searchtype=all&source=header",
        },
      ],
    },
    {
      kind: "Journals",
      title: "Hologram Upscaling for Viewing Angle Expansion Using Light Field Extrapolation with Object Detection Algorithm",
      authors: "Dong-Ha Shin, Chee-Hyeok Song, and Seung-Yeol Lee",
      venue: "Current Optics and Photonics, Vol. 9, Issue 1, pp. 55–64, 2025",
      image: "/asset/hologram-upscaling.png",
      links: [
        { label: "Paper", href: "https://doi.org/10.1364/COPP.499142" },
      ],
    },
    {
      kind: "Journals",
      title:
        "A Technique for Interpreting and Adjusting Depth Information of each Plane by Applying an Object Detection Algorithm to Multi-plane Light-field Image Converted from Hologram Image",
      authors: "Young-Gyu Bae, Dong-Ha Shin, and Seung-Yeol Lee",
      venue: "Journal of Broadcast Engineering, Vol. 28, No. 1, January 2023",
      image: "/asset/depth-adjustment.png",
      links: [{ label: "Paper", href: "https://doi.org/10.5909/JBE.2023.28.1.31" }],
    },
  ] as const

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
        Publications
      </motion.h1>

      <div className="space-y-5">
        {publications.map((pub, index) => (
          <motion.div
            key={pub.title}
            className="glass rounded-2xl p-5 sm:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.06, duration: 0.45 }}
          >
            <div className="grid gap-5 lg:grid-cols-[14rem,1fr] lg:items-start">
              <div className="w-full">
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border/50 bg-black/10">
                  <Image
                    src={withBasePath(pub.image)}
                    alt={pub.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span className="rounded-full border border-border/50 bg-background/20 px-2 py-0.5">
                    {pub.kind}
                  </span>
                  {pub.note ? <span className="truncate">{pub.note}</span> : null}
                </div>

                <h2 className="text-lg sm:text-xl font-medium text-foreground leading-snug">
                  {pub.title}
                </h2>

                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {pub.authors}
                </p>

                <p className="mt-2 text-sm text-indigo-300/90">
                  {pub.venue}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {pub.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/20 px-3 py-1 text-xs text-foreground/90 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-indigo-300/90" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
