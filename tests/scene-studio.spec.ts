import { test, expect } from "./fixtures"
import { parseLayout, type SceneItem } from "../lib/scene-layout"
import fixture from "./scene-layout.fixture.json"

const pixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8y0AAAAASUVORK5CYII="
test.beforeEach(async ({ page }) => {
  await page.addInitScript((scene) => {
    if (!sessionStorage.getItem("studio-loaded")) {
      localStorage.setItem("dongha-scene-v1", JSON.stringify(scene)); sessionStorage.setItem("studio-loaded", "1")
    }
  }, fixture)
  await page.setViewportSize({ width: 1440, height: 1000 })
})

test("uploaded images and editable text links round-trip through JSON and native pages", async ({ page }) => {
  await page.goto("/scene-editor/")
  await page.getByLabel("새 에셋을 붙일 영역", { exact: true }).selectOption("sidebar")
  await page.getByLabel("내 이미지 파일", { exact: true }).setInputFiles({ name: "my-picture.png", mimeType: "image/png", buffer: Buffer.from(pixel.split(",")[1], "base64") })
  await expect(page.getByLabel("이름 / 링크 설명", { exact: true })).toHaveValue("my-picture.png")
  const href = page.getByLabel("직접 링크 주소", { exact: true })
  await href.fill("/gallery/photos/"); await href.press("Enter")
  await page.getByRole("button", { name: "글자 / 링크 추가", exact: true }).click()
  const text = page.getByLabel("글자 내용", { exact: true })
  await text.fill("My <b>own</b> corner\nOpen my photographs")
  // Save must commit the focused textarea before serializing.
  await text.press("Control+s")
  await href.fill("https://example.com/?from=homepage"); await href.press("Enter")
  await page.getByLabel("글꼴", { exact: true }).selectOption("courier")
  await page.getByRole("button", { name: "브라우저에 저장", exact: true }).click()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("dongha-scene-v1")!))
  const custom = saved.items.filter((item: SceneItem) => item.custom)
  expect(custom).toHaveLength(2)
  expect(custom[0].custom.src).toBe(pixel)
  expect(custom[1].custom.text).toContain("<b>own</b>")
  await page.getByText("배치 파일 / 공개 사이트 반영", { exact: true }).click()
  const download = page.waitForEvent("download")
  await page.getByRole("button", { name: "배치 내보내기", exact: true }).click()
  const path = (await (await download).path())!
  await page.getByRole("button", { name: "기본 배치", exact: true }).click()
  await expect(page.getByRole("heading", { name: "에셋 보관함 (2,594)" })).toBeVisible()
  await page.getByLabel("배치 파일", { exact: true }).setInputFiles(path)
  await page.getByRole("button", { name: "브라우저에 저장", exact: true }).click()
  await page.getByRole("link", { name: "홈으로" }).click()
  const imageLink = page.getByRole("link", { name: "my-picture.png", exact: true })
  await expect(imageLink).toHaveAttribute("href", "/gallery/photos/")
  await expect(imageLink.locator("img")).toBeVisible()
  const textLink = page.locator(`[data-scene-id="${custom[1].id}"]:visible`)
  await expect(textLink).toHaveAttribute("href", "https://example.com/?from=homepage")
  await expect(textLink).toHaveText("My <b>own</b> corner\nOpen my photographs")
  await expect(textLink.locator("b")).toHaveCount(0)
  await expect(textLink.locator("span")).toHaveCSS("font-family", /Courier New/)
  const before = await textLink.boundingBox()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(textLink).toBeVisible()
  expect((await textLink.boundingBox())!.width).toBeLessThan(before!.width)
  await page.goto("/publications/")
  await expect(textLink.locator("xpath=..")).toHaveClass(/scene-foreground/)
  await expect(page.locator(".scene-toolbar")).toHaveCount(0)
})

test("multiple selection, locking, snapping, resizing and cancellation are undoable", async ({ page }) => {
  await page.goto("/scene-editor/")
  const layers = page.locator(".scene-layer-list")
  await layers.getByRole("button", { name: "Sun & birds", exact: true }).click()
  await layers.getByRole("button", { name: "Shore bird", exact: true }).click({ modifiers: ["Shift"] })
  await expect(page.locator(".scene-handle.is-selected")).toHaveCount(2)
  await page.getByRole("button", { name: "복제", exact: true }).click()
  await expect(page.locator(".scene-handle")).toHaveCount(13)
  await page.getByRole("button", { name: "선택 잠금 / 해제", exact: true }).click()
  await page.getByRole("button", { name: "선택 뒤로", exact: true }).click()
  await page.keyboard.press("Delete")
  await expect(page.locator(".scene-handle")).toHaveCount(13)
  await page.getByRole("button", { name: "선택 잠금 / 해제", exact: true }).click()
  await page.getByRole("button", { name: "선택 삭제", exact: true }).click()
  await expect(page.locator(".scene-handle")).toHaveCount(11)
  await page.getByRole("button", { name: "되돌리기", exact: true }).click()
  await expect(page.locator(".scene-handle")).toHaveCount(13)
  await layers.getByRole("button", { name: "Sun & birds", exact: true }).click()
  await page.getByLabel("격자 맞춤", { exact: true }).selectOption("16")
  await page.getByRole("button", { name: "패널 접기", exact: true }).click()
  const sun = page.getByRole("button", { name: "이동: Sun & birds", exact: true })
  const before = (await sun.boundingBox())!
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
  await page.mouse.down(); await page.mouse.move(before.x + before.width / 2 + 31, before.y + before.height / 2 + 21)
  await page.mouse.up()
  const snapped = (await sun.boundingBox())!
  expect(Math.abs((snapped.x + snapped.width / 2) / 16 - Math.round((snapped.x + snapped.width / 2) / 16))).toBeLessThan(.01)
  expect(snapped.y % 16).toBeCloseTo(0, 1)
  const resize = page.getByRole("button", { name: "크기 조절: Sun & birds", exact: true })
  const handle = (await resize.boundingBox())!
  await page.mouse.move(handle.x + 7, handle.y + 7); await page.mouse.down()
  await page.mouse.move(handle.x + 47, handle.y + 7); await page.mouse.up()
  expect((await sun.boundingBox())!.width).toBeGreaterThan(snapped.width)
  await sun.focus(); await page.keyboard.press("Control+z")
  expect((await sun.boundingBox())!.width).toBeCloseTo(snapped.width, 1)
  await page.mouse.move(snapped.x + snapped.width / 2, snapped.y + snapped.height / 2)
  await page.mouse.down(); await page.mouse.move(snapped.x + snapped.width / 2 + 60, snapped.y + snapped.height / 2 + 30)
  await page.keyboard.press("Escape"); await page.mouse.up()
  expect((await sun.boundingBox())!.x).toBeCloseTo(snapped.x, 1)
})

test("appearance persists without the sidebar title bar or visible graphics credit", async ({ page }) => {
  await page.goto("/scene-editor/")
  await page.getByText("색상 / 글꼴 / 테두리", { exact: true }).click()
  await page.getByLabel("본문 글꼴", { exact: true }).selectOption("courier")
  await page.getByLabel("본문 배경", { exact: true }).fill("#ffffff")
  await page.getByLabel("패널 테두리", { exact: true }).selectOption("double")
  const width = page.getByLabel("패널 테두리 두께 (px)", { exact: true })
  await width.fill("6"); await width.press("Enter")
  await page.getByRole("button", { name: "브라우저에 저장", exact: true }).click()
  await page.getByRole("link", { name: "홈으로" }).click()
  await expect(page.locator("body")).toHaveCSS("font-family", /Courier New/)
  await expect(page.locator(".page-sheet")).toHaveCSS("background-color", "rgb(255, 255, 255)")
  await expect(page.locator(".page-sheet")).toHaveCSS("border-top-width", "6px")
  await expect(page.locator(".page-sheet")).toHaveCSS("border-top-style", "double")
  await expect(page.locator(".desk-sidebar .window-strip")).toHaveCount(0)
  await expect(page.getByText("Graphics from", { exact: false })).toHaveCount(0)
  const bounds = await page.locator(".page-sheet").boundingBox()
  const slot = await page.locator('.page-sheet > [data-scene-slot="main"]').boundingBox()
  expect(slot!.y).toBeCloseTo(bounds!.y, 1)
  expect(slot!.width).toBeCloseTo(bounds!.width, 1)
})

test("imports reject executable content, unsafe links, CSS injection and invalid custom geometry", () => {
  const item = { ...fixture.items[0], file: "", still: "", custom: { kind: "image", src: pixel, still: pixel } }
  expect(parseLayout({ version: 1, items: [item] }).items).toHaveLength(1)
  for (const href of ["javascript:alert(1)", "data:text/html,x", "//example.com", "/\\example.com", "https://x.com\n<script>"]) {
    expect(() => parseLayout({ version: 1, items: [{ ...item, href }] })).toThrow()
  }
  for (const custom of [{ kind: "image", src: "data:image/svg+xml;base64,PHN2Zz4=", still: pixel }, { kind: "text", text: "a", font: "url(x)" }]) {
    expect(() => parseLayout({ version: 1, items: [{ ...item, custom }] })).toThrow()
  }
  expect(() => parseLayout({ version: 1, items: [item], appearance: { mainColor: "red;}body{display:none}" } })).toThrow()
  expect(() => parseLayout({ version: 1, items: [{ ...item, height: 0 }] })).toThrow()
})
