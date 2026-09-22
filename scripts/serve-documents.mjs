import http from "node:http"
import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import { resolve, sep, extname, join } from "node:path"

const root = resolve("out"), port = Number(process.env.PORT || 3100)
const mime = { ".html": "text/html; charset=utf-8", ".txt": "text/plain", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".wasm": "application/wasm", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2" }
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost")
    const path = decodeURIComponent(url.pathname)
    const base = process.env.NEXT_PUBLIC_BASE_PATH || ""
    if (base && path !== base && !path.startsWith(`${base}/`)) { res.writeHead(404).end(); return }
    let file = resolve(root, `.${path.slice(base.length) || "/"}`)
    if (file !== root && !file.startsWith(`${root}${sep}`)) { res.writeHead(403).end(); return }
    if ((await stat(file)).isDirectory()) {
      if (!url.pathname.endsWith("/")) { res.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end(); return }
      file = join(file, "index.html")
    }
    await stat(file)
    res.setHeader("Content-Type", mime[extname(file)] || "application/octet-stream")
    createReadStream(file).on("error", () => res.destroy()).pipe(res)
  } catch { res.writeHead(404).end("Not found") }
}).listen(port, "127.0.0.1", () => console.log(`Public documents at http://127.0.0.1:${port}`))
