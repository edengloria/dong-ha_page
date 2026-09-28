import { readFileSync } from 'node:fs'
import { test, expect, type Page } from '@playwright/test'

const tracker = readFileSync('lib/analytics.js', 'utf8')
const websiteId = '00000000-0000-4000-8000-000000000001'
const html = (noindex = false) => `<!doctype html><html><head>
  ${noindex ? '<meta name="robots" content="noindex,nofollow">' : ''}
  <script data-website-id="${websiteId}">${tracker}</script></head><body>
  <a href="https://github.com/edengloria/PADO?token=private#secret">GitHub</a>
  <a href="https://scholar.google.com/citations?user=example">Scholar</a>
  <a href="https://doi.org/10.1234/example">Paper</a>
  <a href="/blog/">Internal</a><a href="mailto:private@example.com">Mail</a>
  <a href="https://studio.dhsh.in/preview/private">Preview</a>
  <form><input value="confidential"><a href="https://example.com/secret">Form link</a></form>
  <div contenteditable><a href="https://example.com/private">Editable link</a></div>
  <script>document.addEventListener('click', event => event.preventDefault())</script>
  </body></html>`

async function setup(page: Page, url = 'https://dhsh.in/blog/ko/test/?secret=private#password', noindex = false) {
  let loads = 0
  await page.route('https://cloud.umami.is/script.js', route => {
    loads++
    return route.fulfill({ contentType: 'text/javascript', body: `
      window.analyticsEvents = [];
      const sanitize = window[document.currentScript.dataset.beforeSend];
      window.umami = {track(name, data) {
        window.analyticsEvents.push(sanitize('event', {
          website: '${websiteId}', url: location.href,
          referrer: 'https://www.google.com/search?q=private', name, data
        }));
        return Promise.resolve();
      }};
      window.umami.track();
    ` })
  })
  const requestUrl = new URL(url)
  requestUrl.hash = ''
  await page.route(requestUrl.href, route => route.fulfill({ contentType: 'text/html', body: html(noindex) }))
  await page.goto(url, { waitUntil: 'networkidle' })
  return () => loads
}

test('anonymous pageviews and link events strip queries and never collect form data', async ({ page }) => {
  const loads = await setup(page)
  expect(loads()).toBe(1)
  for (const name of ['GitHub', 'Scholar', 'Paper', 'Internal', 'Mail', 'Preview', 'Form link', 'Editable link']) {
    await page.getByRole('link', { name, exact: true }).click()
  }
  const events = await page.evaluate<Array<{ url: string; referrer: string; data?: { kind: string; destination: string } }>>('window.analyticsEvents')
  expect(events).toHaveLength(4)
  expect(events[0]).toMatchObject({ url: '/blog/ko/test/', referrer: 'https://www.google.com' })
  expect(events.slice(1).map(event => event.data?.kind)).toEqual(['github', 'scholar', 'paper'])
  expect(events[1].data?.destination).toBe('https://github.com/edengloria/PADO')
  expect(JSON.stringify(events)).not.toMatch(/private|password|confidential|secret/)
  expect(await page.evaluate(`window.dhshBeforeSend('identify', { email: 'private@example.com' })`)).toBe(false)
})

test('development, Studio and noindex pages never load the external tracker', async ({ page }) => {
  for (const url of ['http://localhost:3100/', 'https://studio.dhsh.in/preview/post', 'https://example.vercel.app/']) {
    expect((await setup(page, url))()).toBe(0)
  }
  expect((await setup(page, 'https://dhsh.in/scene-editor/', true))()).toBe(0)
})

test('browser privacy signals and the owner opt-out prevent collection', async ({ browser }) => {
  for (const mode of ['dnt', 'gpc', 'owner']) {
    const context = await browser.newContext()
    await context.addInitScript(mode => {
      if (mode === 'owner') localStorage.setItem('umami.disabled', '1')
      else Object.defineProperty(navigator, mode === 'dnt' ? 'doNotTrack' : 'globalPrivacyControl', { value: mode === 'dnt' ? '1' : true })
    }, mode)
    const page = await context.newPage()
    expect((await setup(page))()).toBe(0)
    await context.close()
  }
})

test('an unavailable analytics service leaves links and forms usable', async ({ page }) => {
  await page.route('https://cloud.umami.is/script.js', route => route.abort())
  await page.route('https://dhsh.in/', route => route.fulfill({ contentType: 'text/html', body: html() }))
  await page.goto('https://dhsh.in/')
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.getByRole('link', { name: 'GitHub', exact: true }).click()
  await page.locator('form input').fill('still editable')
  await expect(page.locator('form input')).toHaveValue('still editable')
  await expect(page.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute('href', /github\.com/)
  expect(errors).toEqual([])
})
