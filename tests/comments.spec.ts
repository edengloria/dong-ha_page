import { test, expect } from '@playwright/test'

test('guestbook and post comments remain separate; plaintext rendering, failure recovery and password deletion work', async ({ page }) => {
  const rows: Record<string, { _id: string; name: string; message: string; createdAt: string }[]> = {}
  await page.route('**/api/comments/**', async route => {
    const request = route.request(), url = new URL(request.url())
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Accept, Content-Type' }
    if (request.method() === 'GET') return route.fulfill({ headers, json: { entries: rows[url.searchParams.get('thread')!] || [], next: null } })
    const body = new URLSearchParams(request.postData()!), thread = body.get('thread')!
    if (body.get('action') === 'delete') {
      if (body.get('password') !== 'delete-test') return route.fulfill({ status: 403, headers, json: { error: 'Check the comment and deletion password.' } })
      rows[thread] = rows[thread].filter(row => row._id !== body.get('id'))
      return route.fulfill({ headers, json: { deleted: true } })
    }
    const entry = { _id: 'blogComment.12345678-1234-1234-1234-123456789abc', name: body.get('name')!, message: body.get('message')!, createdAt: '2026-09-28T00:00:00Z' }
    rows[thread] ||= []; rows[thread].push(entry)
    return route.fulfill({ status: 201, headers, json: { id: entry._id } })
  })
  await page.goto('/blog/')
  await expect(page.locator('[data-comment-list-status]')).toContainText('No messages')
  await page.getByLabel('Name', { exact: true }).fill('Visitor')
  await page.getByLabel('Password', { exact: false }).fill('delete-test')
  await page.getByLabel('Guestbook message').fill('<img src=x onerror=alert(1)> 한글 방명록')
  await page.getByRole('button', { name: 'Write', exact: true }).click()
  await expect(page.locator('.comment-list')).toContainText('<img src=x onerror=alert(1)> 한글 방명록')
  await expect(page.locator('.comment-list img')).toHaveCount(0)
  await expect(page.getByLabel('Guestbook message')).toHaveValue('')
  await page.reload()
  await expect(page.locator('.comment-list')).toContainText('한글 방명록')
  await page.getByRole('link', { name: 'KR', exact: true }).click()
  await expect(page.getByLabel('이름', { exact: true })).toBeVisible()
  await expect(page.locator('.comment-list')).toContainText('한글 방명록')
  await page.goto('/blog/ko/angular-spectrum-method/')
  await expect(page.locator('[data-comment-form] [name="thread"]')).toHaveValue('post:fixture.ko.asm')
  await expect(page.locator('.comment-list li')).toHaveCount(0)
  await page.goto('/blog/')
  await page.locator('.comment-list summary').click()
  await page.locator('.comment-delete input[type=password]').fill('wrong-password')
  await page.locator('.comment-delete button').click()
  await expect(page.locator('.comment-delete [role=status]')).toContainText('password')
  await expect(page.locator('.comment-list li')).toHaveCount(1)
  await page.locator('.comment-delete input[type=password]').fill('delete-test')
  await page.locator('.comment-delete button').click()
  await expect(page.locator('.comment-list li')).toHaveCount(0)
})

for (const width of [390, 768, 1440]) test(`blog panels fit ${width}px and only sky decorations remain`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/api/comments/**', route => route.fulfill({ headers: { 'Access-Control-Allow-Origin': '*' }, json: { entries: [], next: null } }))
  await page.goto('/blog/')
  await expect(page.locator('.scene-sprite:not([data-anchor="sky"])')).toHaveCount(0)
  expect(await page.locator('.scene-sprite[data-anchor="sky"]').count()).toBeGreaterThan(0)
  await expect(page.locator('.comment-sidebar img, .comment-sidebar a')).toHaveCount(0)
  await expect(page.locator('.page-sheet .post-list')).toBeVisible()
  await expect(page.getByLabel('Name', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const form = await page.locator('.comment-sidebar').boundingBox(), main = await page.locator('.page-sheet').boundingBox()
  if (width > 900) expect(form!.x + form!.width).toBeLessThan(main!.x)
  else expect(form!.y + form!.height).toBeLessThan(main!.y)
})
