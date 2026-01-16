"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Mail, MapPin, FileText, Github, Linkedin, Instagram } from "lucide-react"
import { cn, withBasePath } from "@/lib/utils"

const navItems = [
  { name: "About", href: "/" },
  { name: "Gallery", href: "/gallery" },
]

const socialLinks = [
  {
    name: "CV",
    href: "/asset/CV_Dong-ha_Shin.pdf",
    icon: FileText,
  },
  {
    name: "GitHub",
    href: "https://github.com/edengloria",
    icon: Github,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/dong-ha-shin-4595a125a/",
    icon: Linkedin,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/shindong__/",
    icon: Instagram,
  },
]

export default function ProfileSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-full lg:w-80 h-fit flex-shrink-0 animate-in fade-in-0 slide-in-from-left-4 duration-500">
      <div className="glass-panel">
        {/* Profile Image */}
        <div
          className="flex justify-center mb-6 animate-in fade-in-0 slide-in-from-bottom-3 duration-500"
          style={{ animationDelay: "200ms" }}
        >
          <div className="relative w-40 h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/20">
            <Image
              src={withBasePath("/asset/gradshot.jpg")}
              alt="Dong-Ha Shin"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 10rem, 12rem"
            />
          </div>
        </div>

        {/* Name and Title */}
        <div
          className="text-center mb-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "300ms" }}
        >
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-2">
            Dong-Ha Shin
          </h1>
          <p className="text-sm text-muted-foreground">
            MS Student @ POSTECH AI
          </p>
        </div>

        {/* Contact Info */}
        <div
          className="space-y-3 mb-8 text-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "400ms" }}
        >
          <div className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <Mail className="h-4 w-4 mr-3 text-indigo-400 flex-shrink-0" />
            <a href="mailto:0218sdh@gmail.com" className="truncate">
              0218sdh@gmail.com
            </a>
          </div>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4 mr-3 text-indigo-400 flex-shrink-0" />
            <span>Seongnam, South Korea</span>
          </div>
        </div>

        {/* Social Links */}
        <div
          className="flex justify-center gap-4 mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "500ms" }}
        >
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.href.startsWith("/") ? withBasePath(link.href) : link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-background/20 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300"
              aria-label={link.name}
            >
              <link.icon className="h-5 w-5" />
            </a>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 mb-6" />

        {/* Navigation */}
        <nav
          className="space-y-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "600ms" }}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-indigo-500/20 text-indigo-300 border-l-2 border-indigo-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/20"
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          className="mt-8 pt-6 border-t border-border/50 text-center animate-in fade-in-0 duration-500"
          style={{ animationDelay: "700ms" }}
        >
          <p className="text-xs text-muted-foreground/70">
            © 2025 Dong-Ha Shin
          </p>
        </div>
      </div>
    </aside>
  )
}
