import Navbar from "@/components/navbar"
import ContentSection from "@/components/content-section"
import BeamsBackground from "@/components/kokonutui/beams-background"

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      <BeamsBackground intensity="strong" />
      <div className="relative z-10">
        <Navbar />
        <ContentSection />
      </div>
    </main>
  )
}
