import { test, expect } from '@playwright/test'
import { parse } from 'node-html-parser'

test('the generated sitemap lists only directly reachable, self-canonical public documents', async ({ request }) => {
  const response = await request.get('/sitemap.xml')
  expect(response.status()).toBe(200)
  const urls = parse(await response.text()).querySelectorAll('loc').map(node => node.textContent)
  expect(urls).toContain('https://dhsh.in/')
  expect(urls.length).toBe(new Set(urls).size)
  for (const url of urls) {
    const canonical = new URL(url)
    expect(canonical.origin).toBe('https://dhsh.in')
    expect(canonical.pathname).toMatch(/\/$/)
    expect(canonical.search + canonical.hash).toBe('')
    const page = await request.get(canonical.pathname, { maxRedirects: 0 })
    expect(page.status(), url).toBe(200)
    const doc = parse(await page.text())
    expect(doc.querySelectorAll('link[rel="canonical"]').map(link => link.getAttribute('href')), url).toEqual([url])
    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '', url).not.toContain('noindex')
    expect(doc.querySelector('meta[http-equiv="refresh"]'), url).toBeNull()
    expect(doc.querySelector('#main-content'), url).not.toBeNull()
  }
  for (const path of ['/404/', '/projects/coming-soon/', '/scene-editor/', '/gallery/admin/', '/blog/search/', '/blog/search/ko/']) {
    expect(urls).not.toContain(`https://dhsh.in${path}`)
  }
})

test('noindex utility pages remain crawlable and missing routes return the custom 404', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toContain('Allow: /')
  expect(robots).toContain('Sitemap: https://dhsh.in/sitemap.xml')
  expect(robots).not.toMatch(/^Disallow:\s*\S/m)
  for (const path of ['/scene-editor/', '/gallery/admin/', '/blog/search/', '/blog/search/ko/']) {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status(), path).toBe(200)
    const doc = parse(await response.text())
    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content'), path).toContain('noindex')
  }
  for (const path of ['/projects/coming-soon/', '/projects/coming-soon/index.html', '/missing-page-for-test/']) {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status(), path).toBe(404)
    const doc = parse(await response.text())
    expect(doc.querySelector('h1')?.textContent, path).toBe('404')
    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content'), path).toContain('noindex')
  }
  const redirect = await request.get('/publications', { maxRedirects: 0 })
  expect(redirect.status()).toBe(301)
  expect(redirect.headers().location).toBe('/publications/')
})
