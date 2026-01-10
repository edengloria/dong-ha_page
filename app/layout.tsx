import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import BeamsBackground from "@/components/kokonutui/beams-background"
import ProfileSidebar from "@/components/profile-sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dong-Ha Shin | Holography Researcher & Machine Learning Engineer",
  description:
    "Personal website of Dong-Ha Shin, a researcher specializing in photonics, holography, and 3D imaging technologies.",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {/* Full-screen background animation */}
          <div className="fixed inset-0 z-0">
            <BeamsBackground intensity="medium" />
          </div>
          
          {/* Main content container */}
          <div className="relative z-10 min-h-screen">
            <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-4 py-6 lg:py-8 gap-6 lg:gap-8">
              {/* Left sidebar - Profile */}
              <ProfileSidebar />
              
              {/* Right content area with glassmorphism */}
              <main className="flex-1 min-w-0">
                <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
