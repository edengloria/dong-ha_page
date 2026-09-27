import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { test } from 'node:test'
import { parse } from 'node-html-parser'
import { renderBody } from '../../lib/publishing/render'
import type { BodyBlock, TextBlock } from '../../lib/publishing/types'
import { createSession, validSession } from '../../publishing/src/lib/auth'

const paragraph = (text: string, marks: TextBlock['markDefs'] = []): TextBlock => ({
  _type: 'block', _key: 'paragraph', style: 'normal', markDefs: marks,
  children: [{ _type: 'span', _key: 'text', text, marks: marks.map(mark => mark._key) }],
})

test('CMS text, attributes and links cannot inject executable markup', async () => {
  const { html } = await renderBody({ body: [
    paragraph('<script>alert(1)</script>', [{ _type: 'link', _key: 'link', href: 'javascript:alert(1)' }]),
    { _type: 'figure', _key: 'figure', asset: { _ref: 'image-abc123-1200x800-png' }, alt: '" onerror="alert(1)', caption: '<img src=x onerror=alert(1)>' },
    { _type: 'equation', _key: 'math', latex: '\\href{javascript:alert(1)}{x}' },
  ] })
  const document = parse(html)
  assert.equal(document.querySelector('script'), null)
  assert.equal(document.querySelector('[onerror]'), null)
  assert.equal(document.querySelector('[href^="javascript:"]'), null)
  assert(document.textContent.includes('<script>alert(1)</script>'))
})

test('scientific figures retain dimensions and offer an uncropped original', async () => {
  const { html } = await renderBody({ body: [{ _type: 'figure', _key: 'plot', asset: { _ref: 'image-abc123-2400x800-png' }, alt: 'A labeled plot', layout: 'wide' }] })
  const document = parse(html), image = document.querySelector('img')!
  assert.equal(image.getAttribute('width'), '2400')
  assert.equal(image.getAttribute('height'), '800')
  assert(image.getAttribute('srcset')!.includes('2400w'))
  assert(image.getAttribute('src')!.includes('fit=max'))
  assert(!document.querySelector('a')!.getAttribute('href')!.includes('?'))
})

test('equation anchors stay stable when ordering changes', async () => {
  const equations: BodyBlock[] = [
    { _type: 'equation', _key: 'propagation', latex: 'e^{ikz}' },
    { _type: 'equation', _key: 'sampling', latex: 'f_N=1/(2d)' },
  ]
  const first = parse((await renderBody({ body: equations })).html)
  const reversed = parse((await renderBody({ body: [...equations].reverse() })).html)
  assert.equal(first.querySelector('#equation-propagation .equation-number')?.textContent, '(1)')
  assert.equal(reversed.querySelector('#equation-propagation .equation-number')?.textContent, '(2)')
})

test('Korean text, math, highlighted code, tables and references arrive in HTML', async () => {
  const { html, referenceHtml } = await renderBody({
    body: [paragraph('전파 모델', [{ _key: 'cite', _type: 'citation', reference: { _ref: 'paper' } }]),
      { _type: 'equation', _key: 'math', latex: '\\lambda=532\\,\\mathrm{nm}' },
      { _type: 'codeBlock', _key: 'code', source: { language: 'python', code: 'print("안녕")', highlightedLines: [1] } },
      { _type: 'table', _key: 'table', header: true, rows: [{ _key: 'a', cells: ['변수', '단위'] }, { _key: 'b', cells: ['z', 'm'] }] }],
    references: [{ _id: 'paper', title: 'A paper', doi: '10.1364/OE.17.019662' }],
  })
  const document = parse(html + referenceHtml, { blockTextElements: { script: true, style: true } })
  for (const selector of ['.katex', 'pre.shiki', '.highlighted', 'table thead th', 'table tbody td', '#reference-1']) assert(document.querySelector(selector), selector)
  assert(document.textContent.includes('전파 모델'))
  assert.equal(document.querySelector('sup a')?.getAttribute('href'), '#reference-1')
  assert.equal(document.querySelector('script'), null)
})

test('unknown CMS blocks fail explicitly instead of silently dropping content', async () => {
  await assert.rejects(renderBody({ body: [{ _type: 'unknown', _key: 'bad' }] as unknown as BodyBlock[] }), /Unknown block type/)
})

test('preview sessions reject tampering, expired cookies and malformed tokens', () => {
  const previous = process.env.PREVIEW_SESSION_SECRET
  process.env.PREVIEW_SESSION_SECRET = 'test-only-preview-secret-not-a-deployment-credential'
  try {
    const session = createSession()
    assert(validSession(session))
    assert(!validSession())
    assert(!validSession(session + '.extra'))
    assert(!validSession(session.replace(/^./, 'x')))
    const payload = Buffer.from(JSON.stringify({ exp: Date.now() - 1000 })).toString('base64url')
    const signature = createHmac('sha256', process.env.PREVIEW_SESSION_SECRET).update(payload).digest('base64url')
    assert(!validSession(`${payload}.${signature}`))
  } finally {
    if (previous === undefined) delete process.env.PREVIEW_SESSION_SECRET
    else process.env.PREVIEW_SESSION_SECRET = previous
  }
})
