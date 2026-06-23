import { AboutSection } from "@/components/home/about-section"
import { createMetadata } from "@/lib/metadata"
import { getLifeImageFilenames } from "@/lib/gallery"

export const metadata = createMetadata()

export default function HomePage() {
  const lifeImages = getLifeImageFilenames()

  return <AboutSection lifeImages={lifeImages} />
}
