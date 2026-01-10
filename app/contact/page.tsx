"use client"

import { motion } from "framer-motion"
import { Mail, MapPin, Clock, Github, Linkedin, Instagram } from "lucide-react"

export default function ContactPage() {
  const socialLinks = [
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/dong-ha-shin-4595a125a/",
      icon: Linkedin,
      username: "dong-ha-shin",
    },
    {
      name: "GitHub",
      href: "https://github.com/edengloria",
      icon: Github,
      username: "edengloria",
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/shindong__/",
      icon: Instagram,
      username: "@shindong__",
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-3xl lg:text-4xl font-light text-white mb-8 tracking-tight"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        Contact
      </motion.h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <motion.div
          className="bg-white/5 border border-white/10 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-xl font-medium text-white mb-6">Get in Touch</h2>

          <div className="space-y-5">
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-indigo-400 mt-0.5 mr-4 flex-shrink-0" />
              <div>
                <h3 className="text-white font-medium">Email</h3>
                <a 
                  href="mailto:0218sdh@gmail.com" 
                  className="text-white/70 hover:text-indigo-400 transition-colors"
                >
                  0218sdh@gmail.com
                </a>
                <p className="text-white/50 text-sm mt-1">For research inquiries and collaboration</p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-indigo-400 mt-0.5 mr-4 flex-shrink-0" />
              <div>
                <h3 className="text-white font-medium">Location</h3>
                <p className="text-white/70">DareeSoft</p>
                <p className="text-white/60 text-sm">
                  37 Hwangsaeul-ro, 258 beon-gil<br />
                  Bundang-gu, Seongnam-si, Gyeonggi-do<br />
                  Republic of Korea
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Clock className="h-5 w-5 text-indigo-400 mt-0.5 mr-4 flex-shrink-0" />
              <div>
                <h3 className="text-white font-medium">Timezone</h3>
                <p className="text-white/70">KST (UTC+9)</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Social Links */}
        <motion.div
          className="bg-white/5 border border-white/10 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="text-xl font-medium text-white mb-6">Connect Online</h2>

          <div className="space-y-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group"
              >
                <link.icon className="h-5 w-5 text-white/60 group-hover:text-indigo-400 transition-colors mr-4" />
                <div>
                  <p className="text-white font-medium group-hover:text-indigo-400 transition-colors">
                    {link.name}
                  </p>
                  <p className="text-white/50 text-sm">{link.username}</p>
                </div>
              </a>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Additional Info */}
      <motion.div
        className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <h2 className="text-xl font-medium text-white mb-4">Open for Collaboration</h2>
        <p className="text-white/70 leading-relaxed">
          I'm always interested in discussing new research opportunities, collaborative projects, 
          and innovative ideas in the fields of holography, computer vision, and AI. 
          Whether you're a fellow researcher, a potential collaborator, or someone curious about my work, 
          feel free to reach out!
        </p>
      </motion.div>
    </motion.div>
  )
}
