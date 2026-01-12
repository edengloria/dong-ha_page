import { getLifeImages } from "@/lib/get-life-images"
import HomeClient from "./home-client"

export default function HomePage() {
  const lifeImages = getLifeImages()

  return <HomeClient lifeImages={lifeImages} />
}
