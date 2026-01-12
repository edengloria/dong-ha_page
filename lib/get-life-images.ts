import fs from "fs"
import path from "path"

export function getLifeImages() {
  const imagesDirectory = path.join(process.cwd(), "public/asset/life-images")
  
  try {
    const fileNames = fs.readdirSync(imagesDirectory)
    // 이미지 파일만 필터링 (jpg, jpeg, png, gif, webp)
    const images = fileNames.filter((fileName) => {
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)
    })
    return images
  } catch (error) {
    console.error("Error reading life images directory:", error)
    return []
  }
}
