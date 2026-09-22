import { test, expect } from "./fixtures"

test("public pages have no backdrop blur or horizontal overflow", async ({ page }) => {
  for (const path of ["/", "/publications/", "/gallery/vinyl/", "/gallery/photos/"]) {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(path)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const blurred = await page.evaluate(() => Array.from(document.querySelectorAll("*"))
      .filter((e) => getComputedStyle(e).backdropFilter !== "none").map((e) => e.className))
    expect(blurred).toEqual([])
  }
})

test("photo diary supports keyboard opening, next, close and focus return", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/gallery/photos/", { waitUntil: "networkidle" })
  // Photo identity remains stable across the viewer's previous/next controls.
  const id = await page.locator(".photo-print").first().getAttribute("data-image-id")
  const photo = page.locator(`.photo-print[data-image-id="${id}"]`)
  await photo.focus()
  await page.keyboard.press("Enter")
  const dialog = page.getByRole("dialog", { name: "Photo viewer" })
  await expect(dialog).toBeVisible()
  const image = await dialog.locator("img").getAttribute("src")
  await page.keyboard.press("ArrowRight")
  await expect(dialog.locator("img")).not.toHaveAttribute("src", image!)
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(photo).toBeFocused()
  expect(errors).toEqual([])
})
