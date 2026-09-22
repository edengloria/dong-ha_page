import { readFile, writeFile, mkdir, stat } from "node:fs/promises"
import { createHash } from "node:crypto"
import sharp from "sharp"
import { chromium } from "@playwright/test"

// Isolated image traces measure browser decode/paint tasks, not GPU presentation.
// Keep originals intact; accept variants only after decoded pixels/timing agree.
const base = process.argv[2] || "http://127.0.0.1:3100"
const root = "public/asset/camerons-world/archive/"
const gif = process.argv.includes("--gif")
const reportDir = `docs/performance/native-scene${gif ? "-gif" : ""}`
const variantDir = gif ? "optimized-gif" : "optimized"
await mkdir(reportDir, { recursive: true })
await mkdir(`${root}${variantDir}`, { recursive: true })
const layout = JSON.parse(await readFile("data/scene-layout.json"))
const catalog = JSON.parse(await readFile(`${root}catalog.json`)).assets
const rows = []
for (const item of layout.items) {
  const entry = catalog.find((asset) => asset.file === item.file)
  const source = root + item.file
  const bytes = (await stat(source)).size
  const meta = await sharp(source, { animated: true }).metadata()
  const row = { id: item.id, file: item.file, width: meta.width, height: meta.pageHeight || meta.height,
    displayWidth: item.desktop.width, frames: meta.pages || 1, bytes, delay: meta.delay, loop: meta.loop }
  if (entry.frames > 1) {
    const name = `${variantDir}/${createHash("sha256").update(item.file).digest("hex").slice(0, 16)}.${gif ? "gif" : "webp"}`
    const image = sharp(source, { animated: true })
    const encoded = await (gif ? image.gif({ reuse: true, effort: 10, interFrameMaxError: 0, interPaletteMaxError: 0, keepDuplicateFrames: true }) : image.webp({ lossless: true, effort: 6, minSize: true })).toBuffer()
    const next = await sharp(encoded, { animated: true }).metadata()
    const original = await sharp(source, { animated: true }).ensureAlpha().raw().toBuffer()
    const decoded = await sharp(encoded, { animated: true }).ensureAlpha().raw().toBuffer()
    let equal = original.length === decoded.length
    for (let i = 0; equal && i < original.length; i += 4) {
      equal = original[i + 3] === decoded[i + 3] && (!original[i + 3] || original.subarray(i, i + 3).equals(decoded.subarray(i, i + 3)))
    }
    row.variantBytes = encoded.length
    row.losslessVerified = equal && JSON.stringify(meta.delay) === JSON.stringify(next.delay) && meta.pages === next.pages && meta.loop === next.loop
    if (row.losslessVerified && encoded.length < bytes) { await writeFile(root + name, encoded); row.variant = name }
  }
  rows.push(row)
}
await writeFile(`${reportDir}/asset-inventory.json`, JSON.stringify(rows, null, 2) + "\n")
if (process.argv.includes("--inventory-only")) process.exit(0)
const browser = await chromium.launch({ channel: "chrome" })
try {
  const page = await browser.newPage({ viewport: { width: 1905, height: 1000 }, deviceScaleFactor: 1 })
  const cdp = await page.context().newCDPSession(page)
  // A plain document avoids framework/beam work contaminating each image trace.
  await page.goto(`${base}/asset/camerons-world/archive/catalog.json`)
  for (const row of rows.filter((row) => row.frames > 1)) {
    row.traces = []
    for (const file of [row.file, row.variant].filter(Boolean)) {
      await page.setContent(`<body style="margin:0;background:#123788"><img width="${row.displayWidth}" src="${base}/asset/camerons-world/archive/${file}"></body>`)
      await page.locator("img").evaluate((img) => img.decode())
      const events = []
      const collect = ({ value }) => events.push(...value)
      cdp.on("Tracing.dataCollected", collect)
      await cdp.send("Tracing.start", { categories: "devtools.timeline,disabled-by-default-devtools.timeline", transferMode: "ReportEvents" })
      const cadence = await page.evaluate(async () => {
        const times = []; let last = 0
        for (let i = 0; i < 90; i++) { const now = await new Promise(requestAnimationFrame); if (last) times.push(now - last); last = now }
        times.sort((a,b) => a-b)
        return { p95Ms: times[Math.floor(times.length * .95)], samples: times.length }
      })
      const complete = new Promise((resolve) => cdp.once("Tracing.tracingComplete", resolve))
      await cdp.send("Tracing.end"); await complete
      cdp.off("Tracing.dataCollected", collect)
      const sum = (names) => events.filter((e) => names.includes(e.name) && e.ph === "X").reduce((n,e) => n + (e.dur || 0),0) / 1000
      row.traces.push({ file, ...cadence, paintMs: sum(["Paint"]), decodeMs: sum(["Decode Image", "ImageDecodeTask"]), rasterMs: sum(["RasterTask"]) })
    }
    console.log(`${row.file}: ${row.bytes} bytes, ${row.frames} frames, variant ${row.variantBytes ?? "none"}`)
    await writeFile(`${reportDir}/asset-inventory.json`, JSON.stringify(rows, null, 2) + "\n")
  }
  await writeFile(`${reportDir}/environment.json`, JSON.stringify({ browser: browser.version(), viewport: "1905x1000@1", gpu: (await (await browser.newBrowserCDPSession()).send("SystemInfo.getInfo")).gpu, note: "Isolated 90-rAF image traces; no beams, no scrolling, not physical display timings." }, null, 2) + "\n")
} finally { await browser.close() }
