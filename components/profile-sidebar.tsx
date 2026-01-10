"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Mail, MapPin, Github, Linkedin, Instagram } from "lucide-react"
import { cn, withBasePath } from "@/lib/utils"

const navItems = [
  { name: "About", href: "/" },
  { name: "Gallery", href: "/gallery" },
]

const socialLinks = [
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
    <motion.aside
      className="w-full lg:w-80 lg:min-h-screen lg:sticky lg:top-6 flex-shrink-0"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="glass-panel lg:min-h-screen">
        {/* Profile Image */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative w-40 h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/20">
            <Image
              src={withBasePath("/asset/gradshot.jpg")}
              alt="Dong-Ha Shin"
              fill
              className="object-cover"
              priority
            />
          </div>
        </motion.div>

        {/* Name and Title */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-2">
            Dong-Ha Shin
          </h1>
          <p className="text-sm text-muted-foreground">
            MS Student @ POSTECH AI
          </p>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          className="space-y-3 mb-8 text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
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
        </motion.div>

        {/* Social Links */}
        <motion.div
          className="flex justify-center gap-4 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-background/20 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300"
              aria-label={link.name}
            >
              <link.icon className="h-5 w-5" />
            </a>
          ))}
        </motion.div>

        {/* Divider */}
        <div className="border-t border-border/50 mb-6" />

        {/* Navigation */}
        <motion.nav
          className="space-y-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
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
        </motion.nav>

        {/* Footer */}
        <motion.div
          className="mt-8 pt-6 border-t border-border/50 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <p className="text-xs text-muted-foreground/70">
            © 2025 Dong-Ha Shin
          </p>
        </motion.div>
      </div>
    </motion.aside>
  )
}
