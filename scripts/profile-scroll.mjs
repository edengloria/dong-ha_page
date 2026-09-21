import { chromium } from "@playwright/test"

// Scripted scroll / rAF cadence, not compositor presentation or input latency.
// Run before and after sequentially on the same idle machine and browser.
const baseURL = process.argv[2] || "http://127.0.0.1:3100"
const viewport = { width: Number(process.env.SCROLL_WIDTH || 1440), height: Number(process.env.SCROLL_HEIGHT || 900) }
const deviceScaleFactor = Number(process.env.SCROLL_DPR || 1)
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || "chrome" })
try {
  const page = await browser.newPage({ viewport, deviceScaleFactor })
  const trials = []
  for (const path of ["/", "/gallery/vinyl/"]) {
    await page.goto(new URL(path, baseURL).href, { waitUntil: "networkidle" })
    await page.mouse.move(0, 0)
    await page.waitForTimeout(1500)
    for (let trial = 1; trial <= 3; trial += 1) {
      const sample = await page.evaluate(async () => {
        document.documentElement.style.scrollBehavior = "auto"
        window.scrollTo(0, 0)
        await new Promise((resolve) => setTimeout(resolve, 350))
        const deltas = []
        let last = 0, position = 0, direction = 1
        for (let frame = 0; frame < 180; frame += 1) {
          const now = await new Promise(requestAnimationFrame)
          if (last && frame > 30) deltas.push(now - last)
          last = now
          const max = document.documentElement.scrollHeight - innerHeight
          position += 35 * direction
          if (position >= max) { position = max; direction = -1 }
          if (position <= 0) { position = 0; direction = 1 }
          window.scrollTo(0, position)
        }
        deltas.sort((a, b) => a - b)
        return {
          meanMs: deltas.reduce((a, b) => a + b, 0) / deltas.length,
          p95Ms: deltas[Math.floor(deltas.length * .95)],
          over25ms: deltas.filter((delta) => delta > 25).length,
          samples: deltas.length,
          classes: document.documentElement.className,
        }
      })
      trials.push({ path, trial, ...sample })
    }
  }
  console.log(JSON.stringify({ baseURL, browser: browser.version(), viewport, deviceScaleFactor, trials }, null, 2))
} finally {
  await browser.close()
}
