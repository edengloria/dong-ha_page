import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'node-html-parser'
import * as pagefind from 'pagefind'

export function publishingOutput() {
  let base = ''
  return { name: 'publishing-output', hooks: {
    'astro:config:done': ({ config }) => { base = config.base.replace(/\/$/, '') },
    'astro:build:done': async ({ dir }) => {
      const out = fileURLToPath(dir), urls = new Map()
      // One mixed-language index supports Korean segmentation and English terms.
      const { index, errors } = await pagefind.createIndex({ rootSelector: '#main-content', forceLanguage: 'ko' })
      if (errors?.length || !index) throw new Error(`Cannot create search index: ${errors}`)
      const xml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char])
      try {
        async function walk(folder) {
          for (const entry of await readdir(folder, { withFileTypes: true })) {
            if (['asset', 'vendor', 'scripts', 'scene-editor', 'admin', 'pagefind'].includes(entry.name)) continue
            const path = join(folder, entry.name)
            if (entry.isDirectory()) { await walk(path); continue }
            if (!entry.name.endsWith('.html') || entry.name === '404.html') continue
            const html = await readFile(path, 'utf8'), doc = parse(html)
            if (doc.querySelector('meta[name="robots"]')?.getAttribute('content')?.includes('noindex')) continue
            const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href')
            if (!canonical || !doc.querySelector('#main-content')) continue
            if (urls.has(canonical)) throw new Error(`Duplicate canonical: ${canonical}`)
            const updated = doc.querySelector('meta[property="article:modified_time"]')?.getAttribute('content')
            urls.set(canonical, updated)
            // Pagefind otherwise drops pages without data-pagefind-body once any
            // article uses it. Add the marker to the indexing copy, never the site.
            doc.querySelector('#main-content').setAttribute('data-pagefind-body', '')
            doc.querySelector('#main-content').setAttribute('data-pagefind-filter', `language:${doc.querySelector('html')?.getAttribute('lang') === 'ko' ? 'ko' : 'en'}`)
            // KaTeX carries visual math, MathML and LaTeX annotations. Indexing
            // all three makes prose search snippets repeat unreadable equations.
            // Keep the accessible equations intact in the actual article HTML.
            for (const math of doc.querySelectorAll('.katex, .equation-number')) math.remove()
            const result = await index.addHTMLFile({ sourcePath: relative(out, path).split(sep).join('/'), url: new URL(canonical).pathname, content: doc.toString() })
            if (result.errors?.length) throw new Error(result.errors.join('\n'))
          }
        }
        await walk(out)
        const result = await index.writeFiles({ outputPath: join(out, 'pagefind') })
        if (result.errors?.length) throw new Error(result.errors.join('\n'))
        await writeFile(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...urls].map(([url, updated]) => `<url><loc>${xml(url)}</loc>${updated ? `<lastmod>${xml(updated)}</lastmod>` : ''}</url>`).join('')}</urlset>`)
        await writeFile(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: ${base}/scene-editor/\nDisallow: ${base}/gallery/admin/\nSitemap: https://dhsh.in${base}/sitemap.xml\n`)
        console.log(`Search and sitemap: ${urls.size} public pages; drafts and noindex pages excluded`)
      } finally { await pagefind.close() }
    },
  } }
}
