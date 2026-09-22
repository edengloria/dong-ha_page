import { stat } from "node:fs/promises"
import sharp from "sharp"
import { test, expect } from "./fixtures"
import optimized from "../data/scene-optimized.json"

test("published optimized GIFs preserve every visible pixel, frame delay and loop", async () => {
  for (const [original, variant] of Object.entries(optimized)) {
    const before = `public/asset/camerons-world/archive/${original}`
    const after = `public/asset/camerons-world/archive/${variant}`
    expect((await stat(after)).size).toBeLessThan((await stat(before)).size)
    const a = await sharp(before, { animated: true }).metadata()
    const b = await sharp(after, { animated: true }).metadata()
    expect([b.width, b.height, b.pages, b.loop, b.delay]).toEqual([a.width, a.height, a.pages, a.loop, a.delay])
    const pixelsA = await sharp(before, { animated: true }).ensureAlpha().raw().toBuffer()
    const pixelsB = await sharp(after, { animated: true }).ensureAlpha().raw().toBuffer()
    expect(pixelsB.length).toBe(pixelsA.length)
    // RGB under fully transparent pixels is intentionally irrelevant.
    for (let i = 0; i < pixelsA.length; i += 4) {
      if (!pixelsA[i + 3]) pixelsA.fill(0, i, i + 3)
      if (!pixelsB[i + 3]) pixelsB.fill(0, i, i + 3)
    }
    expect(pixelsB.equals(pixelsA), original).toBe(true)
  }
})
