"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Mail, MapPin, Phone, Clock, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4">
      <Link href="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Link>

      <motion.div
        className="max-w-4xl mx-auto"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <p className="text-white/80">dongha.shin@research.edu</p>
                  <p className="text-white/60 text-sm">For research inquiries and collaboration</p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-indigo-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-medium">Lab Location</h3>
                  <p className="text-white/80">IPOD Laboratory, Room 301</p>
                  <p className="text-white/80">Department of Photonics</p>
                  <p className="text-white/80">University of Technology</p>
                  <p className="text-white/80">123 Science Drive, Techville</p>
                </div>
              </div>

              <div className="flex items-start">
                <Phone className="h-5 w-5 text-indigo-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-medium">Phone</h3>
                  <p className="text-white/80">+1 (555) 123-4567</p>
                  <p className="text-white/60 text-sm">Lab phone, available during office hours</p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="h-5 w-5 text-indigo-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-medium">Office Hours</h3>
                  <p className="text-white/80">Monday - Friday: 9:00 AM - 5:00 PM</p>
                  <p className="text-white/60 text-sm">Appointments preferred</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-white font-medium mb-3">Connect Online</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-white/70 hover:text-white transition-colors">
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
                <a href="#" className="text-white/70 hover:text-white transition-colors">
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
                <a href="#" className="text-white/70 hover:text-white transition-colors">
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
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </a>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
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

          <motion.div
            className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <h2 className="text-2xl font-light text-white mb-6">Send a Message</h2>

            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-white/80 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-white/80 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Your email address"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-white/80 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Message subject"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-white/80 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Your message"
                ></textarea>
              </div>

              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all"
              >
                Send Message
              </button>
            </form>
          </motion.div>
        </div>

        <motion.div
          className="mt-8 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h2 className="text-2xl font-light text-white mb-6">Research Opportunities</h2>

          <div className="space-y-4 text-white/80">
            <p>
              I'm always looking for talented and motivated students interested in photonics, holography, and
              computational imaging. If you're passionate about these areas and would like to join our research team,
              please get in touch with the following information:
            </p>

            <ul className="list-disc pl-5 space-y-2">
              <li>Your CV/resume</li>
              <li>A brief statement of your research interests</li>
              <li>Relevant coursework and technical skills</li>
              <li>Any previous research experience or publications</li>
            </ul>

            <p>Current opportunities include:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">PhD Positions</h3>
                <p className="text-sm">
                  Two fully-funded positions available for research in computational holography and metasurface design.
                </p>
                <a href="#" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center mt-2">
                  Learn more <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>

              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">Master's Projects</h3>
                <p className="text-sm">
                  Several projects available in real-time hologram generation and optical system design.
                </p>
                <a href="#" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center mt-2">
                  Learn more <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>

              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">Undergraduate Research</h3>
                <p className="text-sm">
                  Summer research opportunities for undergraduates interested in optics and photonics.
                </p>
                <a href="#" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center mt-2">
                  Learn more <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>

              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">Postdoctoral Fellowships</h3>
                <p className="text-sm">One position available for research in advanced holographic display systems.</p>
                <a href="#" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center mt-2">
                  Learn more <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
