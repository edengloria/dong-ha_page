import type { ProfileContent } from "@/content/types"

export const profile: ProfileContent = {
  name: "Dong-Ha Shin",
  nativeName: "신동하",
  role: "MS Student @ POSTECH AI",
  email: "0218sdh@gmail.com",
  location: "Pohang, South Korea",

  portrait: "/asset/gradshot-profile.webp",
  heroAlt: "Dong-Ha Shin",
  about: [
    [
      { type: "text", value: "I am Dong-Ha Shin, a first-year M.S. student at POSTECH, advised by " },
      { type: "link", label: "Prof. Seung-Hwan Baek", href: "https://www.shbaek.com/team/biography" },
      { type: "text", value: " in the " },
      { type: "link", label: "Computational Imaging Group", href: "https://www.shbaek.com/" },
      { type: "text", value: ". As an undergraduate, I conducted research in the " },
      { type: "link", label: "Integrated Plasmonics and Optical Device Laboratory", href: "https://www.ipodlab.com/" },
      { type: "text", value: " under " },
      { type: "link", label: "Prof. Seung-Yeol Lee", href: "https://www.ipodlab.com/members-1" },
      { type: "text", value: "." },
    ],
    [
      { type: "text", value: "My research lies at the intersection of optics, vision, graphics, and artificial intelligence, where I co-design optical hardware and computational algorithms. I am particularly drawn to the multi-dimensional nature of light, including its phase, polarization, and spectrum, whose expressive power remains largely untapped by conventional 2D intensity imaging." },
    ],
    [
      { type: "text", value: "As part of my alternative military service at Dareesoft, an AI startup, I led the development of RiaaS (Road-Information-as-a-Service), now deployed in cities including New York City and Seoul. The work spanned the full stack, from edge-device systems and AI model training to on-device deployment and web services. I also collaborated with Qualcomm on the " },
      { type: "link", label: "NamuhX project", href: "https://www.namuhx.com/" },
      { type: "text", value: ", building both an on-device NPU acceleration pipeline and a voice-interactive AI agent." },
    ],
  ],
  socialLinks: [
    {
      label: "CV",
      href: "/asset/CV_Dong-ha_Shin.pdf",
      icon: "cv",
    },
    {
      label: "GitHub",
      href: "https://github.com/edengloria",
      icon: "github",
      external: true,
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/dong-ha-shin-4595a125a/",
      icon: "linkedin",
      external: true,
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/shindong__/",
      icon: "instagram",
      external: true,
    },
  ],
}
