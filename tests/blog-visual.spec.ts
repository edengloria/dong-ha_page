import { test, expect } from './fixtures'

for (const route of [{ path: '/blog/', name: 'blog' }, { path: '/blog/ko/', name: 'blog-ko' }, { path: '/blog/ko/angular-spectrum-method/', name: 'article' }]) {
  for (const width of [390, 1440]) test(`${route.name} ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => Object.defineProperty(navigator, 'gpu', { value: undefined }))
    await page.route('**/api/comments/**', handler => handler.fulfill({ headers: { 'Access-Control-Allow-Origin': '*' }, json: { entries: [], next: null } }))
    await page.goto(`${route.path}?beamTime=8`, { waitUntil: 'networkidle' })
    await expect(page.locator('.beam-stage')).toHaveAttribute('data-renderer', 'gl', { timeout: 20_000 })
    await expect(page.locator('[data-comment-list-status]')).toHaveText(/No messages yet.|아직 남겨진 글이 없습니다./)
    await page.locator('.scene-sprite img, .page-sheet img').evaluateAll(async images => {
      await Promise.all(images.map(async element => { const image = element as HTMLImageElement; image.loading = 'eager'; await image.decode() }))
    })
    await expect(page).toHaveScreenshot(`${route.name}-${width}.png`, { fullPage: true, animations: 'disabled', maxDiffPixelRatio: .005 })
  })
}
