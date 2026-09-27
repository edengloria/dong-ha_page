import { test, expect } from "./fixtures"

test("Astro emits canonical metadata, complete error documents and isolated applications", async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/publications/")
  await expect(page).toHaveTitle("Publications | Dong-Ha Shin")
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://dhsh.in/publications/")
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", "https://dhsh.in/asset/gradshot.jpg")
  expect(await page.locator("astro-island").count()).toBe(0)
  const report = await (await request.get("/document-build.json")).json()
  expect(report.generator).toBe("Astro")
  for (const path of ["/404.html", "/projects/coming-soon/"]) {
    await page.goto(path)
    await expect(page.getByRole("heading", { name: "404", exact: true })).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow")
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible()
  }
  expect((await request.post("/api/save-preferences", { data: {} })).status()).toBe(404)
})

test("record administration hydrates and retains album selection", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.addInitScript(() => localStorage.setItem("adminAuthed", "1"))
  const errors: string[] = []
  page.on("pageerror", error => errors.push(error.message))
  await page.goto("/gallery/admin/")
  await expect(page.locator("astro-island")).not.toHaveAttribute("ssr")
  await expect(page.getByRole("heading", { name: "Discogs Track Selection Admin" })).toBeVisible()
  await page.locator("button").filter({ has: page.locator("img") }).first().click()
  await expect(page.getByText("Select an album on the left.")).toHaveCount(0)
  await expect(page.getByRole("radiogroup")).toBeVisible()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow")
  expect(errors).toEqual([])
})
