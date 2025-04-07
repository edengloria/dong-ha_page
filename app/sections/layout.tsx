import type React from "react"
import Navbar from "@/components/navbar"

export default function SectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <div className="relative z-10 bg-neutral-950">
        <Navbar />
        <div className="pt-24 pb-16">{children}</div>
      </div>
    </div>
  )
}
