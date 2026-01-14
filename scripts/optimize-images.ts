import fs from "fs"
import path from "path"
import sharp from "sharp"

const LIFE_IMAGES_DIR = path.join(process.cwd(), "public/asset/life-images")
const OPTIMIZED_DIR = path.join(process.cwd(), "public/asset/life-images-optimized")

// Configuration
const MAX_WIDTH = 1200
const JPEG_QUALITY = 80
const WEBP_QUALITY = 80

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]

// Check for --replace flag (for CI/CD in-place optimization)
const REPLACE_MODE = process.argv.includes("--replace")

async function optimizeImage(inputPath: string, outputDir: string): Promise<{ originalSize: number; optimizedSize: number }> {
  const filename = path.basename(inputPath)
  const ext = path.extname(filename).toLowerCase()
  const nameWithoutExt = path.basename(filename, ext)

  if (!IMAGE_EXTENSIONS.includes(ext)) {
    return { originalSize: 0, optimizedSize: 0 }
  }

  try {
    const originalSize = fs.statSync(inputPath).size
    const image = sharp(inputPath)
    const metadata = await image.metadata()

    // Calculate new dimensions maintaining aspect ratio
    let width = metadata.width || MAX_WIDTH
    let height = metadata.height || MAX_WIDTH

    if (width > MAX_WIDTH) {
      height = Math.round((height * MAX_WIDTH) / width)
      width = MAX_WIDTH
    }

    // For replace mode, use temp file then rename
    const tempPath = path.join(outputDir, `_temp_${nameWithoutExt}.jpg`)
    const finalPath = REPLACE_MODE 
      ? path.join(outputDir, `${nameWithoutExt}.jpg`)
      : path.join(outputDir, `${nameWithoutExt}.jpg`)

    // Output optimized JPEG (rotate() applies EXIF orientation automatically)
    await image
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(width, height, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, progressive: true })
      .toFile(tempPath)

    // In replace mode, remove original and rename temp file
    if (REPLACE_MODE) {
      // Remove original file (could be .png, .jpeg, etc.)
      if (fs.existsSync(inputPath) && inputPath !== finalPath) {
        fs.unlinkSync(inputPath)
      }
      // Rename temp to final
      if (tempPath !== finalPath) {
        fs.renameSync(tempPath, finalPath)
      }
    } else {
      // Normal mode: just rename temp file
      fs.renameSync(tempPath, finalPath)
      
      // Also create WebP version in normal mode
      const webpOutputPath = path.join(outputDir, `${nameWithoutExt}.webp`)
      await sharp(inputPath)
        .resize(width, height, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(webpOutputPath)
    }

    const optimizedSize = fs.statSync(finalPath).size
    const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1)

    console.log(
      `✓ ${filename}: ${(originalSize / 1024).toFixed(0)}KB → ${(optimizedSize / 1024).toFixed(0)}KB (${savings}% smaller)`
    )

    return { originalSize, optimizedSize }
  } catch (error) {
    console.error(`✗ Error processing ${filename}:`, error)
    return { originalSize: 0, optimizedSize: 0 }
  }
}

async function main() {
  console.log("🖼️  Starting image optimization...\n")
  
  if (REPLACE_MODE) {
    console.log("⚠️  Running in REPLACE mode - original files will be overwritten!\n")
  }

  // Determine output directory
  const outputDir = REPLACE_MODE ? LIFE_IMAGES_DIR : OPTIMIZED_DIR

  // Ensure output directory exists (only needed for non-replace mode)
  if (!REPLACE_MODE && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Get all image files
  const files = fs.readdirSync(LIFE_IMAGES_DIR).filter((file) => {
    const ext = path.extname(file).toLowerCase()
    return IMAGE_EXTENSIONS.includes(ext)
  })

  console.log(`Found ${files.length} images to optimize\n`)

  let totalOriginalSize = 0
  let totalOptimizedSize = 0

  for (const file of files) {
    const inputPath = path.join(LIFE_IMAGES_DIR, file)
    const result = await optimizeImage(inputPath, outputDir)
    totalOriginalSize += result.originalSize
    totalOptimizedSize += result.optimizedSize
  }

  const totalSavings = totalOriginalSize > 0 
    ? ((1 - totalOptimizedSize / totalOriginalSize) * 100).toFixed(1)
    : "0"

  console.log("\n✅ Optimization complete!")
  console.log(
    `Total: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB → ${(totalOptimizedSize / 1024 / 1024).toFixed(2)}MB (${totalSavings}% smaller)`
  )
  
  if (REPLACE_MODE) {
    console.log(`\nImages optimized in place: ${LIFE_IMAGES_DIR}`)
  } else {
    console.log(`\nOptimized images saved to: ${outputDir}`)
    console.log("\n📝 Next steps:")
    console.log("1. Review the optimized images in the output directory")
    console.log("2. If satisfied, replace the originals or update image paths in code")
    console.log("3. Consider using WebP with JPEG fallback for best performance")
  }
}

main().catch(console.error)
