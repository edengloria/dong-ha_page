import { test, expect } from "./fixtures"
import layout from "../data/scene-layout.json"
import reference from "../data/scene-reference.json"

test("panel decorations reflow without JavaScript and retain the FHD composition", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce", viewport: { width: 1905, height: 1000 } })
  const page = await context.newPage()
  await page.goto("/")
  await expect(page.locator('.desk-sidebar > [data-scene-slot="sidebar"]')).toHaveCount(1)
  await expect(page.locator(".scene-sprite:visible")).toHaveCount(71)
  const mailbox = page.getByRole("link", { name: "Email Dong-Ha", exact: true })
  await expect(mailbox).toHaveAttribute("href", "mailto:d.shin@postech.ac.kr")
  for (const width of [1905, 1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    const boxes = await page.locator(".scene-sprite:visible").evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect(), slot = el.closest("[data-scene-slot]")!.getBoundingClientRect()
      return { id: el.getAttribute("data-scene-id"), left: r.left + r.width / 2, top: r.top, width: r.width, slot: { left: slot.left, top: slot.top, width: slot.width, height: slot.height } }
    }))
    for (const box of boxes) {
      const p = layout.items.find((item) => item.id === box.id)![width <= 560 ? "mobile" : "desktop"]
      if (!("anchor" in p)) continue
      expect(Math.abs(box.left - (box.slot.left + p.x / 100 * box.slot.width))).toBeLessThan(1)
      expect(Math.abs(box.top - (box.slot.top + p.y / 100 * box.slot.height))).toBeLessThan(1)
      const anchor = p.anchor as keyof typeof reference.boxes
      expect(Math.abs(box.width - p.width * Math.min(1, box.slot.width / reference.boxes[anchor].width))).toBeLessThan(1)
    }
  }
  await context.close()
})

test("new assets use the chosen region and pixel/link options survive reload", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/scene-editor/")
  await page.getByLabel("새 에셋을 붙일 영역", { exact: true }).selectOption("sidebar")
  await page.getByRole("searchbox", { name: "파일 검색" }).fill("img/content/11/24.png")
  await page.getByRole("button", { name: "추가: img/content/11/24.png", exact: true }).click()
  await expect(page.getByLabel("붙일 영역", { exact: true })).toHaveValue("sidebar")
  await page.getByLabel("크기 방식", { exact: true }).selectOption("integer")
  await page.getByLabel("정수 배율", { exact: true }).selectOption("2")
  await page.getByRole("checkbox", { name: "픽셀 가장자리 선명하게" }).check()
  await page.getByLabel("이미지 링크", { exact: true }).selectOption("records")
  await page.getByRole("button", { name: "브라우저에 저장", exact: true }).click()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("dongha-scene-v1")!).items.at(-1))
  expect(saved.desktop.anchor).toBe("sidebar")
  expect(saved.mobile.anchor).toBe("sidebar")
  await page.goto("/")
  const sprite = page.locator(`[data-scene-id="${saved.id}"]:visible`)
  await expect(sprite).toHaveAttribute("href", "/gallery/vinyl/")
  await expect(sprite).toHaveCSS("image-rendering", "pixelated")
  await expect(sprite).toHaveCSS("width", `${saved.width * 2}px`)
  await page.setViewportSize({ width: 960, height: 1000 })
  await expect(sprite).toHaveCSS("width", `${saved.width * 2}px`)
  await page.goto("/scene-editor/")
  await page.getByLabel(/배치한 에셋/).selectOption(saved.id)
  await page.getByLabel("크기 방식", { exact: true }).selectOption("original")
  await expect(page.locator(`[data-scene-id="${saved.id}"]:visible`)).toHaveCSS("width", `${saved.width}px`)
})

test("inner route panel covers home decorations while sidebar links remain clickable", async ({ page }) => {
  await page.setViewportSize({ width: 1905, height: 1000 })
  await page.goto("/publications/")
  const covered = page.locator('[data-scene-id="623dd9e1-1efb-40e4-b2c9-5ced7b9d9989"]:visible')
  // Give the decorative image hit testing solely to verify actual paint ordering.
  await covered.evaluate((el) => { (el as HTMLElement).style.pointerEvents = "auto" })
  await covered.scrollIntoViewIfNeeded()
  const box = (await covered.boundingBox())!
  expect(await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest(".scene-sprite"), { x: box.x + box.width / 2, y: box.y + box.height / 2 })).toBe(false)
  const mailbox = page.getByRole("link", { name: "Email Dong-Ha", exact: true })
  await mailbox.click({ trial: true })
  await mailbox.focus()
  await expect(mailbox).toBeFocused()
})

test("photo links support normal clicks, new tabs, and no-JavaScript browsing", async ({ page, browser }) => {
  await page.goto("/gallery/photos/")
  const photo = page.locator("a.photo-print").first()
  await expect(photo).toHaveAttribute("href", /\/asset\/life-images\//)
  const popup = page.context().waitForEvent("page")
  await photo.click({ modifiers: ["ControlOrMeta"] })
  const original = await popup
  // A browser-created tab can briefly report about:blank before committing.
  await expect(original).toHaveURL(/\/asset\/life-images\//)
  await original.close()
  await photo.click()
  await expect(page.getByRole("dialog", { name: "Photo viewer" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  const context = await browser.newContext({ javaScriptEnabled: false })
  const plain = await context.newPage()
  await plain.goto("/gallery/photos/")
  expect(await plain.locator('noscript a[href*="/life-images/"]').count()).toBeGreaterThan(12)
  await plain.locator("a.photo-print").first().click()
  expect(plain.url()).toContain("/asset/life-images/")
  await context.close()
})

test("initial reduced motion skips WASM and texture loading, then can enable animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  const requests: string[] = []
  page.on("request", (request) => { if (/thorvg\.wasm|\/asset\/beams\//.test(request.url())) requests.push(request.url()) })
  await page.goto("/", { waitUntil: "networkidle" })
  await expect(page.locator(".beam-stage")).toHaveAttribute("data-renderer", "static")
  await expect(page.locator(".beam-stage canvas")).toHaveCount(0)
  expect(requests).toEqual([])
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await expect(page.locator(".beam-stage")).toHaveAttribute("data-renderer", /wg|gl/, { timeout: 20000 })
  await expect.poll(async () => Number(await page.locator(".beam-stage").getAttribute("data-frames"))).toBeGreaterThan(15)
})
