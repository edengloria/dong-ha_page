import type { ProfileContent } from "@/content/types"

export const profile: ProfileContent = {
  name: "Dong-Ha Shin",
  nativeName: "신동하",
  role: "MS Student @ POSTECH AI",
  email: "0218sdh@gmail.com",
  location: "Pohang, South Korea",

  portrait: "/asset/gradshot.jpg",
  heroAlt: "Dong-Ha Shin",
  about: [
    [
      { type: "text", value: "I am Dong-Ha Shin, a first-year M.S. student in the " },
      {
        type: "link",
        label: "Computational Imaging Group",
        href: "https://www.shbaek.com/",
      },
      { type: "text", value: ", led by " },
      {
        type: "link",
        label: "Prof. Seung-Hwan Baek",
        href: "https://www.shbaek.com/team/biography",
      },
      { type: "text", value: "." },
    ],
    [
      { type: "text", value: "During my undergraduate studies, I was affiliated with the " },
      {
        type: "link",
        label: "Integrated Plasmonics and Optical Device Laboratory",
        href: "https://www.ipodlab.com/",
      },
      { type: "text", value: ", advised by " },
      {
        type: "link",
        label: "Prof. Seung-Yeol Lee",
        href: "https://www.ipodlab.com/members-1",
      },
      { type: "text", value: "." },
    ],
    [
      {
        type: "text",
        value:
          "My research interests broadly lie in co-designing novel systems at the intersection of optics, vision, graphics, and artificial intelligence. I believe the multi-dimensional nature of light holds expressive power and untapped potential that extend well beyond conventional 2D intensity images.",
      },
    ],
    [
      {
        type: "text",
        value:
          "As part of my military service, I led the development of a globally deployed Road-Information-as-a-Service (RiaaS), currently operating in real-world environments across cities including New York City and Seoul, encompassing edge-device systems, AI model training, on-device AI deployment, and full web services. Additionally, through the ",
      },
      {
        type: "link",
        label: "NamuhX project",
        href: "https://www.namuhx.com/",
      },
      {
        type: "text",
        value:
          ", I collaborated with Qualcomm, designing and implementing both an on-device NPU acceleration pipeline and a voice-interactive AI agent.",
      },
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
