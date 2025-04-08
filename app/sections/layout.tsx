import type React from "react"
import BeamsBackground from "@/components/kokonutui/beams-background"
import Navbar from "@/components/navbar"

export default function SectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <BeamsBackground intensity="medium" />
      <div className="relative z-10">
        <Navbar />
        <div className="pt-24 pb-16">{children}</div>
      </div>
    </div>
  )
}
