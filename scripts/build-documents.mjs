import { build } from "esbuild"
import { parse } from "node-html-parser"
import { readFile, writeFile, readdir, mkdir, copyFile } from "node:fs/promises"
import { join, relative, resolve, sep } from "node:path"

const out = resolve("out"), base = process.env.NEXT_PUBLIC_BASE_PATH || ""
const fixture = process.env.DOCUMENT_VISUAL_TEST === "1"
// Test-only frozen animation must never reach the Pages workflow.
if (fixture && process.env.GITHUB_WORKFLOW === "Deploy to GitHub Pages") throw new Error("Visual fixture builds cannot be deployed")
const result = await build({
  entryPoints: ["lib/native/document.ts"], outdir: "out/scripts", entryNames: "[name]-[hash]", chunkNames: "[name]-[hash]",
  bundle: true, splitting: true, format: "esm", platform: "browser", target: "es2020", minify: true, metafile: true,
  define: { "process.env.NODE_ENV": JSON.stringify(fixture ? "development" : "production"), "process.env.NEXT_PUBLIC_BASE_PATH": JSON.stringify(base) },
})
const inputs = Object.keys(result.metafile.inputs)
if (inputs.some((file) => /node_modules\/(?:react|react-dom|next)\//.test(file.replaceAll("\\", "/")))) throw new Error("Public scripts must not include React or Next")
const entry = Object.entries(result.metafile.outputs).find(([, value]) => value.entryPoint === "lib/native/document.ts")
if (!entry) throw new Error("Native document entry missing")
const publicUrl = (path) => `${base}/${relative(out, resolve(path)).split(sep).join("/")}`
const scriptUrl = publicUrl(entry[0])
await mkdir(join(out, "styles"), { recursive: true })
const styles = new Map()
const pages = []
const privatePage = (path) => path.startsWith("scene-editor/") || path.startsWith("gallery/admin/")
async function walk(dir) {
  for (const file of await readdir(dir, { withFileTypes: true })) {
    if (file.name === "_next" || file.name === "asset" || file.name === "vendor") continue
    const path = join(dir, file.name), name = relative(out, path).split(sep).join("/")
    if (file.isDirectory()) { if (!privatePage(`${name}/`)) await walk(path); continue }
    if (!name.endsWith(".html") || privatePage(name)) continue
    const source = await readFile(path, "utf8")
    // Next can export notFound() routes as an empty client error shell. Give
    // those known 404s the complete exported error document before removing JS.
    const document = parse(source.includes('id="__next_error__"') && source.includes("NEXT_HTTP_ERROR_FALLBACK;404")
      ? await readFile(join(out, "404.html"), "utf8") : source, { comment: false })
    const body = document.querySelector("body"), head = document.querySelector("head")
    if (!body || !head || !document.querySelector("#main-content")) throw new Error(`Incomplete exported document: ${name}`)
    if (document.querySelector(".scene-toolbar")) throw new Error(`Editor leaked into ${name}`)
    // Keep structured data, but no framework bootstrap, Flight data or JS preload.
    document.querySelectorAll("script").forEach((script) => { if (script.getAttribute("type") !== "application/ld+json") script.remove() })
    for (const link of document.querySelectorAll("link")) {
      if (link.getAttribute("as") === "script" || link.getAttribute("rel") === "modulepreload") { link.remove(); continue }
      if (link.getAttribute("rel") !== "stylesheet") continue
      const href = link.getAttribute("href")
      if (href?.startsWith(`${base}/styles/`)) continue
      if (!href?.startsWith(`${base}/_next/static/css/`)) throw new Error(`Unexpected stylesheet: ${href}`)
      if (!styles.has(href)) {
        const local = href.slice(base.length + 1), destination = `styles/${local.split("/").at(-1)}`
        await copyFile(join(out, local), join(out, destination))
        styles.set(href, `${base}/${destination}`)
      }
      link.setAttribute("href", styles.get(href)); link.removeAttribute("data-precedence")
    }
    document.querySelectorAll("[data-nimg]").forEach((img) => img.removeAttribute("data-nimg"))
    document.querySelectorAll('template[data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"]').forEach((el) => el.remove())
    const route = name === "index.html" ? "/" : `/${name.replace(/index\.html$/, "")}`
    body.setAttribute("data-document-page", route)
    head.insertAdjacentHTML("beforeend", `<script type="module" src="${scriptUrl}"></script>`)
    // Preserve opt-in analytics without depending on next/script hydration.
    const ga = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
    if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true" && ga) {
      if (!/^G-[A-Z0-9]+$/.test(ga)) throw new Error("Invalid analytics measurement ID")
      head.insertAdjacentHTML("beforeend", `<script async src="https://www.googletagmanager.com/gtag/js?id=${ga}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}');</script>`)
    }
    const html = document.toString()
    if (/__next_f|\/_next\/[^"<>\s]*\.js/.test(html)) throw new Error(`Framework script remains in ${name}`)
    await writeFile(path, html)
    pages.push(route)
  }
}
await walk(out)
for (const route of ["/", "/publications/", "/gallery/", "/gallery/photos/", "/gallery/vinyl/"]) {
  if (!pages.includes(route)) throw new Error(`Missing public document: ${route}`)
}
await copyFile("data/scene-layout.json", join(out, "scene-published.json"))
const report = { pages: pages.sort(), entry: scriptUrl, entryBytes: entry[1].bytes, frameworkRuntime: false, visualFixture: fixture,
  scripts: Object.fromEntries(Object.entries(result.metafile.outputs).map(([file, value]) => [publicUrl(file), value.bytes])) }
await writeFile(join(out, "document-build.json"), JSON.stringify(report, null, 2))
console.log(`Public documents: ${pages.length}; native entry: ${entry[1].bytes} bytes; React/Next runtime: none${fixture ? " (visual fixture)" : ""}`)
