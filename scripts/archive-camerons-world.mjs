import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import sharp from "sharp"

// Archive only images referenced by the site's own HTML, CSS and JavaScript.
// Do not execute source scripts or follow external archive/tracking links.
const origin = "https://www.cameronsworld.net/"
const root = "public/asset/camerons-world/archive"
await fs.mkdir(root, { recursive: true })
async function download(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
      if (!response.ok) {
        if (response.status === 404) throw new Error("404")
        throw new Error(`HTTP ${response.status}`)
      }
      return Buffer.from(await response.arrayBuffer())
    } catch (error) {
      if (error.message === "404" || attempt === 2) throw error
    }
  }
}
const html = (await download(origin)).toString()
const sources = [{ url: origin, body: html }]
const linked = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:css|js))["']/g)]
  .map((match) => new URL(match[1], origin)).filter((url) => url.origin === new URL(origin).origin)
for (const url of linked) sources.push({ url: url.href, body: (await download(url)).toString() })
const images = new Set()
for (const { url, body } of sources) {
  for (const match of body.matchAll(/(?:\.\.\/|\/)?img\/[\w/.,@%+()-]+\.(?:png|gif|jpg|jpeg|svg|webp)/gi)) {
    const image = new URL(match[0], url)
    if (image.origin === new URL(origin).origin) images.add(image.href)
  }
}
// Include linked site icons and social preview images too.
for (const match of html.matchAll(/(?:href|content)=["']([^"']+\.(?:png|gif|jpg|jpeg|svg|webp))["']/gi)) {
  const url = new URL(match[1], origin)
  if (url.origin === new URL(origin).origin) images.add(url.href)
}
const queue = [...images].sort(), assets = [], failures = []
let cursor = 0
await Promise.all(Array.from({ length: 6 }, async () => {
  while (cursor < queue.length) {
    const source = queue[cursor++]
    const file = new URL(source).pathname.slice(1)
    const destination = path.join(root, file)
    try {
      let bytes
      try { bytes = await fs.readFile(destination) } catch { bytes = await download(source) }
      const meta = await sharp(bytes).metadata()
      await fs.mkdir(path.dirname(destination), { recursive: true })
      await fs.writeFile(destination, bytes)
      const id = file.replace(/\.[^.]+$/, "").replaceAll("/", "-") + "-" + meta.format
      const thumbnail = `thumbs/${id}.webp`
      await fs.mkdir(path.join(root, "thumbs"), { recursive: true })
      await sharp(bytes).resize({ width: 160, height: 120, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(root, thumbnail))
      const still = (meta.pages || 1) > 1 ? `stills/${id}.png` : file
      if (still !== file) {
        await fs.mkdir(path.join(root, "stills"), { recursive: true })
        await sharp(bytes).png().toFile(path.join(root, still))
      }
      assets.push({ id, file, source, width: meta.width, height: meta.pageHeight || meta.height,
        frames: meta.pages || 1, group: file.match(/img\/content\/([^/]+)/)?.[1] || "UI",
        thumbnail, still, bytes: bytes.length, sha256: crypto.createHash("sha256").update(bytes).digest("hex") })
    } catch (error) { failures.push({ source, error: error.message }) }
    if ((assets.length + failures.length) % 100 === 0) console.log(`${assets.length} saved, ${failures.length} unavailable / ${queue.length}`)
  }
}))
// Some visible graphics exist only as rectangles inside sprite atlases. Make each
// such rectangle independently selectable while retaining the original atlas.
const originals = assets.length
const tiles = new Set()
for (const source of sources.filter((entry) => entry.url.endsWith(".css"))) {
  for (const match of source.body.matchAll(/([^{}]+)\{([^}]+)\}/g)) {
    const [, selector, rule] = match
    const image = rule.match(/background-image:url\(([^)]+\/sprites\/[^)]+)\)/)?.[1]
    const position = rule.match(/background-position:\s*(-?\d+)(?:px)?\s+(-?\d+)(?:px)?/)
    const width = Number(rule.match(/(?:^|;)width:(\d+)px/)?.[1])
    const height = Number(rule.match(/(?:^|;)height:(\d+)px/)?.[1])
    if (!image || !position || !width || !height) continue
    const atlasURL = new URL(image, source.url).href
    const atlas = assets.find((entry) => entry.source === atlasURL)
    if (!atlas) continue
    const rect = { left: -Number(position[1]), top: -Number(position[2]), width, height }
    const key = atlas.file + JSON.stringify(rect)
    if (tiles.has(key)) continue
    tiles.add(key)
    const id = "tile-" + crypto.createHash("sha256").update(key).digest("hex").slice(0, 16)
    const file = `extracted/${id}.png`, thumbnail = `thumbs/${id}.webp`
    await fs.mkdir(path.join(root, "extracted"), { recursive: true })
    const bytes = await sharp(path.join(root, atlas.file)).extract(rect).png().toBuffer()
    await fs.writeFile(path.join(root, file), bytes)
    await sharp(bytes).resize({ width: 160, height: 120, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(root, thumbnail))
    assets.push({ id, file, source: atlasURL, width, height, frames: 1,
      group: selector.match(/section\.id-(\d+)/)?.[1] || "UI", thumbnail, still: file,
      bytes: bytes.length, sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
      derived: { atlas: atlas.file, rect, selector } })
  }
}
assets.sort((a, b) => a.file.localeCompare(b.file, "en", { numeric: true }))
const manifest = { source: origin, retrieved: new Date().toISOString(), sources: sources.map(({ url, body }) => ({ url, sha256: crypto.createHash("sha256").update(body).digest("hex") })), referenced: queue.length, originals, extracted: assets.length - originals, assets, failures }
await fs.writeFile(path.join(root, "catalog.json"), JSON.stringify(manifest, null, 2) + "\n")
console.log(JSON.stringify({ referenced: queue.length, saved: assets.length, failures, bytes: assets.reduce((sum, asset) => sum + asset.bytes, 0) }, null, 2))
if (failures.some((item) => item.error !== "404")) process.exitCode = 1
