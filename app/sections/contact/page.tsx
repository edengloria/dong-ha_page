"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Mail, MapPin, Clock } from "lucide-react"
import Link from "next/link"

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4">
      <Link href="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Link>

      <motion.div
        className="max-w-3xl mx-auto"
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
          Contact
        </motion.h1>

        <motion.div
          className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-2xl font-light text-white mb-6">Get in Touch</h2>

          <div className="space-y-4">
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-indigo-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-white font-medium">Email</h3>
                <p className="text-white/80">0218sdh@gmail.com</p>
                <p className="text-white/60 text-sm">For research inquiries and collaboration</p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-indigo-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-white font-medium">Location</h3>
                <p className="text-white/80">DareeSoft</p>
                <p className="text-white/80">37 Hwangsaeul-ro, 258 beon-gil</p>
                <p className="text-white/80">Bundang-gu, Seongnam-si, Gyeonggi-do</p>
                <p className="text-white/80">Republic of Korea</p>
              </div>
            </div>

            <div className="flex items-start">
              <Clock className="h-5 w-5 text-indigo-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-white font-medium">Timezone</h3>
                <p className="text-white/80">KST (UTC+9)</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-white font-medium mb-3">Connect Online</h3>
            <div className="flex space-x-4">
              <a href="https://www.linkedin.com/in/dong-ha-shin-4595a125a/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
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
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              <a href="https://github.com/edengloria" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
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
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </a>
              <a href="https://www.instagram.com/shindong__/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
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
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
