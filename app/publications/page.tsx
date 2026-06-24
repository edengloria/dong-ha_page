import { PublicationsSection } from "@/components/home/publications-section"
import { createMetadata } from "@/lib/metadata"

export const metadata = createMetadata({
  title: "Publications",
  description: "Publications and open-source work by Dong-Ha Shin.",
  path: "/publications",
})

export default function PublicationsPage() {
  return <PublicationsSection className="space-y-6" titleClassName="mb-8" prioritizeFirstImage />
}
