import { languageOf, messages } from './language'
import { toHTML } from '@portabletext/to-html'
import { codeToHtml } from 'shiki'
import katex from 'katex'
import { renderDemo } from './demos/render'
import type { DemoBlock } from './types'
import { dataset, projectId, type BodyBlock, type Figure, type Post, type Paper, type TextBlock } from './types'

export const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
export function safeUrl(value?: string) {
  if (!value) return ''
  try { const url = new URL(value); return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : '' } catch { return '' }
}
export function imageAsset(figure?: Figure) {
  const match = figure?.asset?._ref.match(/^image-([a-z\d]+)-(\d+)x(\d+)-(png|jpg|jpeg|webp|gif|avif)$/i)
  if (!match) return null
  const [, hash, width, height, format] = match
  return { url: `https://cdn.sanity.io/images/${projectId}/${dataset}/${hash}-${width}x${height}.${format}`, width: Number(width), height: Number(height) }
}
const anchor = (prefix: string, key = '') => `${prefix}-${key.replace(/[^a-zA-Z0-9_-]/g, '-')}`
type Numbered = { id: string; number: number; label: string }
export interface TocItem { id: string; text: string; level: number }

export async function renderBody(post: Pick<Post, 'body' | 'references'> & Partial<Pick<Post, 'language'>>) {
  const t = messages[languageOf(post.language)]
  const body = post.body || [], papers = new Map((post.references || []).map(paper => [paper._id, paper]))
  const figureNumbers = new Map<string, Numbered>(), equationNumbers = new Map<string, Numbered>(), citations = new Map<string, number>()
  const code = new Map<string, string>(), toc: TocItem[] = []
  let figures = 0, equations = 0
  const visit = (blocks: BodyBlock[]) => {
    for (const block of blocks) {
      if (block._type === 'figure' && block.numbered !== false) figureNumbers.set(block._key, { id: anchor('figure', block._key), number: ++figures, label: block.label || '' })
      if (block._type === 'equation' && block.numbered !== false) equationNumbers.set(block._key, { id: anchor('equation', block._key), number: ++equations, label: block.label || '' })
      if (block._type === 'figureGallery') visit(block.figures || [])
      if (block._type === 'callout') visit(block.body || [])
      if (block._type === 'block') {
        if (/^h[234]$/.test(block.style || '')) toc.push({ id: anchor('section', block._key), text: block.children.map(child => child._type === 'span' ? child.text : child._type === 'inlineMath' ? child.latex : '').join(''), level: Number(block.style!.slice(1)) })
        for (const mark of block.markDefs || []) if (mark._type === 'citation' && mark.reference?._ref && !citations.has(mark.reference._ref)) citations.set(mark.reference._ref, citations.size + 1)
      }
      if (block._type === 'paper' && block.reference?._ref && !citations.has(block.reference._ref)) citations.set(block.reference._ref, citations.size + 1)
    }
  }
  visit(body)
  for (const paper of post.references || []) if (!citations.has(paper._id)) citations.set(paper._id, citations.size + 1)
  for (const block of body) {
    if (block._type !== 'codeBlock') continue
    const allowed = new Set(['python', 'cpp', 'javascript', 'typescript', 'glsl', 'bash', 'json', 'text'])
    const language = allowed.has(block.source?.language || '') ? block.source!.language! : 'text'
    const highlighted = new Set(block.source?.highlightedLines || [])
    code.set(block._key, await codeToHtml(block.source?.code || '', {
      lang: language, theme: 'github-light',
      transformers: [{ line(node, line) { if (highlighted.has(line)) this.addClassToHast(node, 'highlighted') } }],
    }))
  }
  function math(latex: string, displayMode: boolean) {
    return katex.renderToString(latex || '', { displayMode, throwOnError: false, trust: false, maxExpand: 1000, maxSize: 20, output: 'htmlAndMathml' })
  }
  function figure(value: Figure) {
    const asset = imageAsset(value)
    if (!asset) return '<p class="content-placeholder">Add a figure image in Studio.</p>'
    const widths = [...new Set([480, 768, 1200, 1600, 2400, 3200, asset.width].filter(width => width <= Math.min(asset.width, 4000)))].sort((a, b) => a - b)
    const src = `${asset.url}?w=${Math.min(asset.width, 1600)}&fit=max&auto=format&q=90`
    const srcset = widths.map(width => `${asset.url}?w=${width}&fit=max&auto=format&q=90 ${width}w`).join(', ')
    const image = `<img src="${escapeHtml(src)}" srcset="${escapeHtml(srcset)}" sizes="(max-width: 800px) calc(100vw - 40px), ${value.layout === 'wide' || value.layout === 'full' ? '1120px' : '760px'}" width="${asset.width}" height="${asset.height}" alt="${escapeHtml(value.alt)}" loading="lazy" decoding="async">`
    const number = figureNumbers.get(value._key)
    const credit = value.credit ? `<span class="figure-credit">${safeUrl(value.creditUrl) ? `<a href="${escapeHtml(safeUrl(value.creditUrl))}" rel="noopener noreferrer">${escapeHtml(value.credit)}</a>` : escapeHtml(value.credit)}</span>` : ''
    return `<figure id="${anchor('figure', value._key)}" class="research-figure layout-${['wide', 'full'].includes(value.layout || '') ? value.layout : 'normal'}">${value.expandable !== false ? `<a class="figure-expand" href="${asset.url}" target="_blank" rel="noopener noreferrer" aria-label="View full-resolution figure: ${escapeHtml(value.alt || value.caption)}">${image}</a>` : image}<figcaption>${number ? `<strong>Figure ${number.number}.</strong> ` : ''}${escapeHtml(value.caption)}${credit}</figcaption></figure>`
  }
  const paperHtml = (paper: Paper) => {
    const links = [['Paper', paper.url || (paper.doi ? `https://doi.org/${paper.doi.replace(/^https?:\/\/doi.org\//, '')}` : '')], ['Project', paper.projectUrl], ['Code', paper.codeUrl]].filter(([, href]) => safeUrl(href))
    return `<strong>${escapeHtml(paper.title)}</strong><p>${escapeHtml((paper.authors || []).join(', '))}</p><p>${escapeHtml([paper.venue, paper.year].filter(Boolean).join(' · '))}</p><div class="paper-links">${links.map(([label, href]) => `<a href="${escapeHtml(safeUrl(href))}" rel="noopener noreferrer">${label}</a>`).join(' ')}${paper.bibtex ? `<details><summary>BibTeX</summary><pre>${escapeHtml(paper.bibtex)}</pre></details>` : ''}</div>`
  }
  function blocksHtml(blocks: BodyBlock[]): string {
    return toHTML(blocks, {
      onMissingComponent: (message) => { throw new Error(message) },
      components: {
        block: {
          h2: ({ value, children }) => `<h2 id="${anchor('section', value._key)}">${children}</h2>`,
          h3: ({ value, children }) => `<h3 id="${anchor('section', value._key)}">${children}</h3>`,
          h4: ({ value, children }) => `<h4 id="${anchor('section', value._key)}">${children}</h4>`,
        },
        marks: {
          link: ({ value, children }) => safeUrl(value?.href) ? `<a href="${escapeHtml(safeUrl(value?.href))}" rel="noopener noreferrer">${children}</a>` : children,
          citation: ({ value, children }) => {
            const ref = value?.reference?._ref as string | undefined, number = ref && citations.get(ref)
            return number ? `${children}<sup><a href="#reference-${number}" aria-label="Reference ${number}">[${number}]</a></sup>` : children
          },
        },
        types: {
          figure: ({ value }) => figure(value as Figure),
          inlineMath: ({ value }) => `<span class="inline-equation">${math(value.latex, false)}</span>`,
          equation: ({ value }) => `<div class="equation" id="${anchor('equation', value._key)}"><div class="equation-scroll" tabindex="0" aria-label="Equation">${math(value.latex, true)}</div>${equationNumbers.has(value._key) ? `<span class="equation-number">(${equationNumbers.get(value._key)!.number})</span>` : ''}</div>`,
          codeBlock: ({ value }) => `<figure class="code-block"><div class="code-toolbar"><span>${escapeHtml(value.source?.filename || value.source?.language || 'Code')}</span><button type="button" data-copy-code>${t.copy}</button></div>${code.get(value._key) || `<pre><code>${escapeHtml(value.source?.code)}</code></pre>`}${value.caption ? `<figcaption>${escapeHtml(value.caption)}</figcaption>` : ''}</figure>`,
          callout: ({ value }) => `<aside class="callout tone-${['note', 'important', 'warning', 'summary'].includes(value.tone) ? value.tone : 'note'}"><strong>${escapeHtml(value.title || value.tone || 'Note')}</strong>${blocksHtml((value.body || []) as TextBlock[])}</aside>`,
          separator: () => '<hr>',
          table: ({ value }) => `<figure class="article-table"><div class="table-scroll" tabindex="0" role="region" aria-label="${escapeHtml(value.caption || 'Table')}"><table>${value.caption ? `<caption>${escapeHtml(value.caption)}</caption>` : ''}${(value.rows || []).map((row: { cells: string[] }, i: number) => { const heading = i === 0 && value.header !== false; return `${heading ? '<thead>' : i === 1 || (i === 0 && !heading) ? '<tbody>' : ''}<tr>${row.cells.map(cell => heading ? `<th scope="col">${escapeHtml(cell)}</th>` : `<td>${escapeHtml(cell)}</td>`).join('')}</tr>${heading ? '</thead>' : ''}` }).join('')}${value.rows?.length > (value.header !== false ? 1 : 0) ? '</tbody>' : ''}</table></div></figure>`,
          paper: ({ value }) => papers.has(value.reference?._ref) ? `<aside class="paper-card">${paperHtml(papers.get(value.reference._ref)!)}</aside>` : '',
          figureGallery: ({ value }) => `<div class="figure-gallery columns-${value.columns === 3 ? 3 : 2}">${(value.figures || []).map(figure).join('')}${value.caption ? `<p class="gallery-caption">${escapeHtml(value.caption)}</p>` : ''}</div>`,
          crossReference: ({ value }) => { const target = figureNumbers.get(value.target) || equationNumbers.get(value.target); return target ? `<a href="#${target.id}">${figureNumbers.has(value.target) ? `Figure ${target.number}` : `Eq. (${target.number})`}</a>` : '<span>[reference unavailable]</span>' },
          demo: ({ value }) => renderDemo(value as DemoBlock),
        },
      },
    })
  }
  const html = blocksHtml(body)
  const referenceHtml = citations.size ? `<section class="references" aria-labelledby="references-heading"><h2 id="references-heading">${t.references}</h2><ol>${[...citations].map(([id, number]) => `<li id="reference-${number}">${papers.has(id) ? paperHtml(papers.get(id)!) : '<p>Reference unavailable.</p>'}</li>`).join('')}</ol></section>` : ''
  return { html, referenceHtml, toc }
}
