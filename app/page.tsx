import { AboutSection } from "@/components/home/about-section"
import { createMetadata } from "@/lib/metadata"

export const metadata = createMetadata()

export default function HomePage() {
  return <AboutSection />
}
