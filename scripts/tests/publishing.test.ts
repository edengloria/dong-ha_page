import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { test } from 'node:test'
import { parse } from 'node-html-parser'
import { renderBody } from '../../lib/publishing/render'
import type { BodyBlock, TextBlock } from '../../lib/publishing/types'
import { createSession, validSession } from '../../publishing/src/lib/auth'
import { validateFigurePresence, validateFigureAlt } from '../../studio/schema/validation'
import { translationsFor, safeJson } from '../../lib/publishing/seo'
import { publishingFixture } from '../../tests/fixtures/publishing'
import { seriesParts } from '../../lib/publishing/query'
import { encodeSignatureHeader } from '@sanity/webhook'
import { verifySignature, parseEvent, eventId, readSmallBody } from '../../publishing/src/lib/webhook'
import { angularSpectrumProfile } from '../../lib/publishing/demos/angular-spectrum-model'
import { dispatchPublication } from '../../publishing/src/lib/deploy'

function deploymentStore() {
  let record: Record<string, unknown> | undefined, revision = 0
  const client = {
    async createIfNotExists(value: Record<string, unknown>) {
      record ||= { ...value, _rev: String(++revision) }
      return structuredClone(record)
    },
    async getDocument() { return structuredClone(record) },
    patch() {
      let expected: unknown, changes: Record<string, unknown>
      const patch = {
        ifRevisionId(value: unknown) { expected = value; return patch },
        set(value: Record<string, unknown>) { changes = value; return patch },
        async commit() {
          if (record?._rev !== expected) throw new Error('Revision conflict')
          record = { ...record, ...changes, _rev: String(++revision) }
          return structuredClone(record)
        },
      }
      return patch
    },
  }
  return client as unknown as NonNullable<Parameters<typeof dispatchPublication>[1]>['client']
}

test('concurrent webhook deliveries claim one deployment and acknowledge later duplicates', async () => {
  const event = parseEvent(JSON.stringify({ id: 'dedupe-test', type: 'post', operation: 'update', revision: 'revision-1', projectId: 'f0xserx3', dataset: 'production' }))!
  let dispatches = 0
  const dependencies = { client: deploymentStore(), request: async (_path: string, body?: unknown) => {
    assert.deepEqual(body, { ref: 'main', inputs: { cms_event: eventId(event) } })
    dispatches++
    return { workflow_run_id: 123 }
  } }
  const results = await Promise.allSettled([dispatchPublication(event, dependencies), dispatchPublication(event, dependencies)])
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1)
  assert.equal(dispatches, 1)
  assert.equal((await dispatchPublication(event, dependencies)).duplicate, true)
  assert.equal(dispatches, 1)
})

test('a lost GitHub response recovers the accepted workflow without dispatching twice', async () => {
  const event = parseEvent(JSON.stringify({ id: 'response-loss-test', type: 'post', operation: 'delete', revision: 'revision-2', projectId: 'f0xserx3', dataset: 'production' }))!
  let dispatches = 0
  const dependencies = { client: deploymentStore(), request: async (path: string) => {
    if (path.includes('/runs?')) return { workflow_runs: [{ display_title: `CMS ${eventId(event)}`, id: 456 }] }
    dispatches++
    throw new Error('Response lost after GitHub accepted the run')
  } }
  await assert.rejects(dispatchPublication(event, dependencies), /Response lost/)
  const recovered = await dispatchPublication(event, dependencies)
  assert.equal(recovered.duplicate, true)
  assert.equal(dispatches, 1)
})

test('registered optical demo preserves the zero-distance field and sampled energy', () => {
  const atSource = angularSpectrumProfile(532, 0), propagated = angularSpectrumProfile(532, 60)
  atSource.forEach((value, x) => assert(Math.abs(value - Math.exp(-2 * (((x - 64) * 8) / 60) ** 2)) < 1e-12))
  assert(Math.abs(atSource.reduce((a, b) => a + b, 0) - propagated.reduce((a, b) => a + b, 0)) < 1e-10)
  assert(propagated[64] < atSource[64])
})
test('cross references track target keys through inserted figures and equations', async () => {
  const target: BodyBlock = { _type: 'equation', _key: 'chosen', latex: 'z=1' }
  const reference: BodyBlock = { _type: 'block', _key: 'xref', style: 'normal', children: [{ _type: 'crossReference', _key: 'ref', target: 'chosen' }] }
  const original = parse((await renderBody({ body: [target, reference] })).html)
  const inserted = parse((await renderBody({ body: [{ _type: 'equation', _key: 'inserted', latex: 'x=0' }, target, reference] })).html)
  assert.equal(original.querySelector('a')?.textContent, 'Eq. (1)')
  assert.equal(inserted.querySelector('a')?.textContent, 'Eq. (2)')
  assert.equal(inserted.querySelector('a')?.getAttribute('href'), '#equation-chosen')
})

test('webhook accepts signed public changes and rejects tampering, replay, foreign and draft events', async () => {
  const secret = 'a-test-only-webhook-secret-that-is-not-used-in-production'
  const event = { id: 'article-123', type: 'post', operation: 'update', revision: 'revision-2', projectId: 'f0xserx3', dataset: 'production' }
  const body = JSON.stringify(event), now = Date.now(), signature = await encodeSignatureHeader(body, now, secret)
  assert(await verifySignature(body, signature, secret, now))
  assert(!await verifySignature(body + ' ', signature, secret, now))
  assert(!await verifySignature(body, signature, secret, now + 301_000))
  assert(!await verifySignature(body, null, secret, now))
  const parsed = parseEvent(body)!
  assert(parsed)
  assert.equal(eventId(parsed), eventId(parseEvent(JSON.stringify({ ...event, unused: 'ignored' }))!))
  assert.notEqual(eventId(parsed), eventId({ ...parsed, operation: 'delete' }))
  assert.equal(parseEvent(JSON.stringify({ ...event, id: 'drafts.article-123' })), null)
  assert.equal(parseEvent(JSON.stringify({ ...event, projectId: 'foreign' })), null)
  assert.equal(parseEvent(JSON.stringify({ ...event, type: 'publishingEvent' })), null)
  assert.equal(parseEvent('{bad-json'), null)
})
test('webhook body reader enforces byte limits even without content-length', async () => {
  await assert.rejects(readSmallBody(new Request('https://example.test/', { method: 'POST', body: 'x'.repeat(17_000) })), /too large/)
  assert.equal(await readSmallBody(new Request('https://example.test/', { method: 'POST', body: '{}' })), '{}')
})

test('translation pairs are reciprocal and series navigation follows numeric order', () => {
  const { posts } = publishingFixture
  assert.deepEqual(translationsFor(posts[0], posts).map(item => item.language), ['ko', 'en'])
  assert.deepEqual(translationsFor(posts[1], posts).map(item => item.language), ['ko', 'en'])
  assert.deepEqual(translationsFor(posts[2], posts), [])
  assert.deepEqual(seriesParts(posts[0], [...posts].reverse()).map(item => item.seriesOrder), [1, 2])
  assert(!safeJson({ title: '</script><script>alert(1)</script>' }).includes('<'))
})

const paragraph = (text: string, marks: TextBlock['markDefs'] = []): TextBlock => ({
  _type: 'block', _key: 'paragraph', style: 'normal', markDefs: marks,
  children: [{ _type: 'span', _key: 'text', text, marks: marks.map(mark => mark._key) }],
})

test('a post can omit its cover, while inserted figures need images and alt text', () => {
  const defaults = { asset: undefined }
  assert.equal(validateFigurePresence(defaults, { path: ['heroImage'] }), true)
  assert.equal(validateFigurePresence(defaults, { path: ['seo', 'socialImage'] }), true)
  assert.equal(validateFigureAlt(undefined, { parent: defaults }), true)
  assert.notEqual(validateFigurePresence(defaults, { path: ['body', { _key: 'figure' }] }), true)
  assert.notEqual(validateFigurePresence({ caption: 'An intended cover' }, { path: ['heroImage'] }), true)
  assert.notEqual(validateFigureAlt('  ', { parent: { asset: { _ref: 'image-abc-100x100-png' } } }), true)
  assert.equal(validateFigureAlt('A labeled plot', { parent: { asset: { _ref: 'image-abc-100x100-png' } } }), true)
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
