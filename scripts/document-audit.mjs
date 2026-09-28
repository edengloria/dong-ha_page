import { readFile, writeFile, readdir } from "node:fs/promises"
import { join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "node-html-parser"

// Inspect Astro's output and Vite's complete client graph. Never rewrite HTML.
export function documentAudit(visualFixture) {
  let chunks = new Map(), base = ""
  return {
    name: "public-document-audit",
    hooks: {
      "astro:config:setup": ({ config, updateConfig }) => {
        base = config.base.replace(/\/$/, "")
        updateConfig({ vite: { plugins: [{
          name: "capture-client-graph",
          apply: "build",
          generateBundle(_options, bundle) {
            if (this.environment.config.consumer === "server") return
            chunks = new Map(Object.entries(bundle).filter(([, value]) => value.type === "chunk"))
          },
        }] } })
      },
      "astro:build:done": async ({ dir }) => {
        const out = fileURLToPath(dir), pages = [], roots = new Set(), sceneRoots = new Set()
        async function walk(folder) {
          for (const file of await readdir(folder, { withFileTypes: true })) {
            if (["asset", "vendor", "scripts", "scene-editor"].includes(file.name)) continue
            const path = join(folder, file.name), name = relative(out, path).split(sep).join("/")
            if (name.startsWith("gallery/admin")) continue
            if (file.isDirectory()) { await walk(path); continue }
            if (!name.endsWith(".html")) continue
            const html = await readFile(path, "utf8"), doc = parse(html)
            if (!doc.querySelector("#main-content") || !doc.querySelector("body")?.hasAttribute("data-document-page")) throw new Error(`Incomplete public document: ${name}`)
            if (doc.querySelector("astro-island, .scene-toolbar") || /__next_f|\/_next\//.test(html)) throw new Error(`Framework or editor leaked into ${name}`)
            for (const script of doc.querySelectorAll('script[src]')) {
              const src = script.getAttribute("src")
              if (src.startsWith("https://www.googletagmanager.com/")) continue
              if (!src.startsWith(`${base}/scripts/`)) throw new Error(`Unexpected public script: ${src}`)
              const name = src.slice(base.length + 1)
              roots.add(name)
              if (!doc.querySelector('body')?.hasAttribute('data-reading-page')) sceneRoots.add(name)
            }
            pages.push(doc.querySelector("body").getAttribute("data-document-page"))
          }
        }
        await walk(out)
        for (const route of ["/", "/publications/", "/gallery/", "/gallery/photos/", "/gallery/vinyl/"]) {
          if (!pages.includes(route)) throw new Error(`Missing public document: ${route}`)
        }
        const scripts = {}, visited = new Set()
        function check(name) {
          if (visited.has(name)) return
          visited.add(name)
          const chunk = chunks.get(name)
          if (!chunk) throw new Error(`Public chunk not audited: ${name}`)
          if (Object.keys(chunk.modules).some(id => /node_modules\/(?:react|react-dom|next)\//.test(id.replaceAll("\\", "/")))) throw new Error(`Framework runtime in public graph: ${name}`)
          scripts[`${base}/${name}`] = Buffer.byteLength(chunk.code)
          for (const dep of [...chunk.imports, ...chunk.dynamicImports]) check(dep)
        }
        for (const root of roots) check(root)
        if (sceneRoots.size !== 1) throw new Error(`Expected one scene document entry, got ${sceneRoots.size}`)
        const initial = new Set()
        function initialImports(name) {
          if (initial.has(name)) return
          initial.add(name)
          for (const dep of chunks.get(name).imports) initialImports(dep)
        }
        for (const root of sceneRoots) initialImports(root)
        const entry = `${base}/${[...sceneRoots][0]}`
        const initialBytes = [...initial].reduce((sum, name) => sum + scripts[`${base}/${name}`], 0)
        const report = { generator: "Astro", pages: pages.sort(), entry, entryBytes: scripts[entry], initialBytes, readingEntries: [...roots].filter(name => !sceneRoots.has(name)).map(name => `${base}/${name}`), frameworkRuntime: false, visualFixture, scripts }
        await writeFile(join(out, "document-build.json"), JSON.stringify(report, null, 2))
        console.log(`Public documents: ${pages.length}; native entry: ${report.entryBytes} bytes; framework runtime: none`)
      },
    },
  }
}
