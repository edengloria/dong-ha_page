import type { NavigationItem } from "@/content/types"

export const siteConfig = {
  url: "https://dhsh.in",
  title: "Dong-Ha Shin | 신동하",
  description:
    "Personal website of Dong-Ha Shin, an M.S. student at POSTECH AI working across optics, vision, graphics, and artificial intelligence.",
  locale: "en_US",
  ogImage: "/asset/gradshot.jpg",
  keywords: [
    "Dong-Ha Shin",
    "POSTECH",
    "computational imaging",
    "optics",
    "computer vision",
    "graphics",
    "artificial intelligence",
  ],
  copyrightYear: "2025",
} as const

export const primaryNavigation: NavigationItem[] = [
  { label: "About", href: "/" },
  { label: "Gallery", href: "/gallery" },
]
