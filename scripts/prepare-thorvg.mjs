import { copyFile, mkdir, readdir, stat } from "node:fs/promises"
import sharp from "sharp"

await mkdir("public/vendor/thorvg", { recursive: true })
await copyFile("node_modules/@thorvg/webcanvas/dist/thorvg.wasm", "public/vendor/thorvg/thorvg.wasm")
await copyFile("node_modules/@thorvg/webcanvas/LICENSE", "public/vendor/thorvg/LICENSE")
await mkdir("public/asset/beams", { recursive: true })
// Offline light textures: no runtime blur or gradient construction.
for (const [index, color] of [[83, 158, 242], [99, 119, 240], [135, 104, 238]].entries()) {
  const width = 96, height = 512
  const pixels = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const across = (x / (width - 1) - .5) * 2
      const alpha = Math.exp(-across * across * 7) * Math.pow(Math.sin(Math.PI * y / (height - 1)), 1.6)
      pixels.set([...color, Math.round(alpha * 210)], (y * width + x) * 4)
    }
  }
  await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toFile(`public/asset/beams/${index}.png`)
}

// Static export cannot resize at request time. Keep originals for the viewer,
// but serve small WebP prints to the contact sheet and homepage.
await mkdir("public/asset/life-thumbs", { recursive: true })
const photos = (await readdir("public/asset/life-images")).filter((name) => /\.(jpe?g|png|webp|gif)$/i.test(name))
for (let i = 0; i < photos.length; i += 4) {
  await Promise.all(photos.slice(i, i + 4).map(async (name) => {
    const input = `public/asset/life-images/${name}`
    const output = `public/asset/life-thumbs/${name}.webp`
    const cached = await stat(output).catch(() => null)
    if (cached && cached.mtimeMs >= (await stat(input)).mtimeMs) return
    await sharp(input).rotate().resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toFile(output)
  }))
}
