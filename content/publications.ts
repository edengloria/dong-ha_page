import type { Publication } from "@/content/types"

export const publications: Publication[] = [
  {
    kind: "Open-source",
    title: "PADO: PyTorch Automatic Differentiable Optics",
    authors: "Seung-Hwan Baek, Dong-Ha Shin, Yujin Jeon, Seung-Woo Yoon, Eunsue Choi, Gawoon Ban, Hyunmo Kang",
    venue: "2025",

    image: "/asset/pado.png",
    links: [
      { label: "Code", href: "https://github.com/shwbaek/pado" },
      { label: "Document", href: "https://shwbaek.github.io/pado/" },
    ],
  },
  {
    kind: "Journals",
    title: "Complex-Valued Holographic Radiance Fields",
    authors: "Yicheng Zhan, Dong-Ha Shin, Seung-Hwan Baek, and Kaan Akşit",
    venue: "ACM Transactions on Graphics (presented in SIGGRAPH 2026)",
    image: "/asset/CVHNerF.PNG",
    links: [
      {
        label: "Paper",
        href: "https://arxiv.org/abs/2506.08350",
      },
    ],
  },
  {
    kind: "Journals",
    title:
      "Hologram Upscaling for Viewing Angle Expansion Using Light Field Extrapolation with Object Detection Algorithm",
    authors: "Dong-Ha Shin, Chee-Hyeok Song, and Seung-Yeol Lee",
    venue: "Current Optics and Photonics, Vol. 9, Issue 1, pp. 55-64, 2025",
    image: "/asset/hologram-upscaling.png",
    links: [{ label: "Paper", href: "https://doi.org/10.1364/COPP.499142" }],
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
]
