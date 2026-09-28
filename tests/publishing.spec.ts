import { test, expect } from '@playwright/test'

const article = '/blog/ko/angular-spectrum-method/'
test('technical article is complete without JavaScript, with stable SEO and translation links', async ({ browser, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(article)
  await expect(page.locator('#article-body')).toContainText('정적 HTML 검증용')
  await expect(page.locator('pre.shiki')).toContainText('torch.fft.fft2')
  await expect(page.locator('.katex')).toHaveCount(2)
  await expect(page.locator('table')).toContainText('Variable')
  await expect(page.locator('#reference-1')).toContainText('Matsushima')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://dhsh.in${article}`)
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://dhsh.in/blog/en/angular-spectrum-method/')
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() || '{}')
  expect(schema['@graph'].find((entry: { '@type': string }) => entry['@type'] === 'BlogPosting').inLanguage).toBe('ko')
  await expect(page.locator('a[rel="next"]')).toHaveAttribute('href', '/blog/ko/propagation-sampling/')
  expect(await page.locator('astro-island, canvas, .beam-stage').count()).toBe(0)
  const xml = await (await request.get('/sitemap.xml')).text()
  expect(xml).toContain(`https://dhsh.in${article}`)
  expect(xml).not.toContain('/scene-editor/')
  expect(await (await request.get('/feed.xml')).text()).toContain('Angular Spectrum')
  await context.close()
})

for (const width of [390, 768, 1440]) {
  test(`article fits ${width}px, preserves figure ratio and copies code`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 })
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(article)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await expect(page.locator('.research-figure img')).toHaveAttribute('width', '1200')
    await expect(page.locator('.research-figure img')).toHaveAttribute('height', '800')
    await page.getByRole('button', { name: 'Copy', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Copied', exact: true })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('spectrum = torch.fft.fft2(field)')
  })
}

test('static search finds Korean prose, English titles, tags and references', async ({ page }) => {
  await page.goto('/blog/search/')
  for (const query of ['PyTorch', '전파', 'Matsushima']) {
    await page.getByRole('searchbox').fill(query)
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(page.locator('#search-results')).toContainText('Angular Spectrum Method 구현 노트')
    await expect(page.locator('#search-results')).toContainText('Angular Spectrum Method in PyTorch')
  }
})

test('taxonomies, series and main navigation link to generated pages', async ({ page }) => {
  await page.goto('/blog/topics/optics/')
  await expect(page.getByRole('link', { name: 'Angular Spectrum Method 구현 노트' })).toBeVisible()
  await page.goto('/blog/series/fourier-optics/')
  await expect(page.getByRole('link', { name: '전파 커널의 샘플링', exact: true })).toBeVisible()
  for (const route of ['/projects/', '/about/', '/blog/']) {
    const response = await page.goto(route)
    expect(response?.status()).toBe(200)
    await expect(page.locator('#main-content')).toBeVisible()
  }
  await page.goto(article)
  await page.getByRole('link', { name: 'PADO: PyTorch Automatic Differentiable Optics', exact: true }).click()
  await expect(page).toHaveURL(/\/projects\/#pado$/)
  await expect(page.locator('#pado').getByRole('link', { name: 'Angular Spectrum Method 구현 노트', exact: true })).toHaveAttribute('href', article)
})

test('registered demo hydrates only where present and responds to keyboard controls', async ({ page }) => {
  const scripts: string[] = []
  page.on('request', request => { if (request.resourceType() === 'script') scripts.push(request.url()) })
  await page.goto(article)
  expect(scripts.some(url => /runtime\./.test(url))).toBe(false)
  await page.goto('/blog/ko/propagation-sampling/')
  const slider = page.locator('[data-demo-distance]')
  await expect(slider).toBeEnabled()
  const before = await page.locator('[data-demo-profile]').getAttribute('points')
  await slider.focus(); await slider.press('ArrowRight')
  await expect(page.locator('[data-demo-distance-label]')).toHaveText('31 mm')
  await expect(page.locator('[data-demo-profile]')).not.toHaveAttribute('points', before!)
})
