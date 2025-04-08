"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "About", href: "#about" },
  { name: "Research", href: "#research" },
  { name: "Publications", href: "#publications" },
  { name: "Experience", href: "#experience" },
  { name: "Patents", href: "#patents" },
  { name: "Awards", href: "#awards" },
  { name: "Gallery", href: "#gallery" },
  { name: "Contact", href: "#contact" },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Close mobile menu when clicking a nav item
  const handleNavItemClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <motion.header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-black/20 backdrop-blur-xl border-b border-white/10 py-3" : "bg-transparent py-5",
      )}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <motion.div className="text-white font-light text-xl tracking-tighter" whileHover={{ scale: 1.05 }}>
          <span className="font-semibold">D.H.</span> Shin
        </motion.div>
        <nav className="hidden md:flex space-x-1">
          {navItems.map((item) => (
            <NavItem key={item.name} {...item} />
          ))}
        </nav>
        <div className="md:hidden">
          <button 
            className="text-white p-2"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-md md:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="flex flex-col space-y-4 text-center">
                {navItems.map((item) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    className="text-xl text-white/80 hover:text-white py-2 px-4"
                    onClick={handleNavItemClick}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {item.name}
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

function NavItem({ name, href }: { name: string; href: string }) {
  return (
    <motion.a
      href={href}
      className="relative px-3 py-2 text-sm text-white/80 hover:text-white transition-colors duration-200 font-light tracking-tight"
      whileHover={{ scale: 1.05 }}
    >
      <span className="relative z-10">{name}</span>
      <motion.span
        className="absolute inset-0 rounded-md -z-10 opacity-0"
        initial={{ opacity: 0 }}
        whileHover={{
          opacity: 0.1,
          background: "linear-gradient(90deg, #4F46E5, #9333EA)",
          boxShadow: "0 0 15px rgba(79, 70, 229, 0.5)",
        }}
        transition={{ duration: 0.2 }}
      />
    </motion.a>
  )
}
