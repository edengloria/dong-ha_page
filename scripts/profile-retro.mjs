import { chromium } from "@playwright/test"

// Measures browser task/rAF cadence, not physical display presentation or GPU time.
const baseURL = process.argv[2] || "http://127.0.0.1:3102"
const browser = await chromium.launch({ channel: "chrome" })
try {
  const system = await (await browser.newBrowserCDPSession()).send("SystemInfo.getInfo")
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: Number(process.env.PROFILE_DPR || 2) })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send("Performance.enable")
  const trials = []
  for (const path of ["/", "/gallery/vinyl/"]) {
    await page.goto(new URL(path, baseURL).href, { waitUntil: "networkidle" })
    await page.mouse.move(0, 0)
    await page.waitForTimeout(2000)
    for (let trial = 1; trial <= 3; trial++) {
      const events = []
      const collect = ({ value }) => events.push(...value)
      cdp.on("Tracing.dataCollected", collect)
      await cdp.send("Tracing.start", { categories: "devtools.timeline", transferMode: "ReportEvents" })
      const before = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map(({ name, value }) => [name, value]))
      const sample = await page.evaluate(async () => {
        const stage = document.querySelector(".beam-stage")
        const startFrames = Number(stage?.dataset.frames || 0)
        const longTasks = []
        const observer = new PerformanceObserver((list) => longTasks.push(...list.getEntries().map((e) => e.duration)))
        observer.observe({ type: "longtask" })
        const deltas = []
        let last = 0, position = 0, direction = 1
        document.documentElement.style.scrollBehavior = "auto"
        for (let frame = 0; frame < 240; frame++) {
          const now = await new Promise(requestAnimationFrame)
          if (last && frame > 30) deltas.push(now - last)
          last = now
          const max = document.documentElement.scrollHeight - innerHeight
          position = Math.max(0, Math.min(max, position + direction * 35))
          if (position >= max) direction = -1
          if (position <= 0) direction = 1
          scrollTo(0, position)
        }
        observer.disconnect()
        deltas.sort((a, b) => a - b)
        return {
          p95Ms: deltas[Math.floor(deltas.length * .95)], over25ms: deltas.filter((n) => n > 25).length,
          samples: deltas.length, longTasks, beamFrames: Number(stage?.dataset.frames || 0) - startFrames,
          renderer: stage?.dataset.renderer || "legacy", quality: stage?.dataset.quality, fps: stage?.dataset.fps,
        }
      })
      const after = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map(({ name, value }) => [name, value]))
      const complete = new Promise((resolve) => cdp.once("Tracing.tracingComplete", resolve))
      await cdp.send("Tracing.end")
      await complete
      cdp.off("Tracing.dataCollected", collect)
      trials.push({ path, trial, ...sample, mainThreadMs: (after.TaskDuration - before.TaskDuration) * 1000,
        layoutMs: (after.LayoutDuration - before.LayoutDuration) * 1000, styleMs: (after.RecalcStyleDuration - before.RecalcStyleDuration) * 1000,
        paintEvents: events.filter((event) => event.name === "Paint").length,
        paintMs: events.filter((event) => event.name === "Paint").reduce((sum, event) => sum + (event.dur || 0), 0) / 1000 })
    }
  }
  console.log(JSON.stringify({ baseURL, browser: browser.version(), viewport: `1920x1080@${process.env.PROFILE_DPR || 2}`, gpu: system.gpu, trials }, null, 2))
} finally { await browser.close() }
