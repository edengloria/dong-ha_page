import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

// This Vite middleware exists only in astro dev; the Pages build has no writable API.
export function preferencesServer(base = "/") {
  let queue = Promise.resolve()
  return {
    name: "local-track-preferences",
    apply: "serve",
    configureServer(server) {
      const endpoint = `${base.replace(/\/$/, "")}/api/save-preferences`
      const prefsPath = resolve(server.config.root, "data/track-preferences.json")
      server.middlewares.use(async (req, res, next) => {
        // Astro strips its base before Vite middleware runs; Connect retains
        // the browser URL in originalUrl.
        if ((req.originalUrl || req.url)?.split("?")[0].replace(/\/$/, "") !== endpoint) return next()
        const send = (status, body) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)) }
        if (req.method !== "POST") return send(405, { ok: false, error: "Use POST." })
        // Reject cross-site writes to the local working tree.
        try {
          if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return send(403, { ok: false, error: "Origin mismatch." })
          let raw = ""
          for await (const chunk of req) {
            raw += chunk.toString()
            if (Buffer.byteLength(raw) > 16384) return send(413, { ok: false, error: "Request too large." })
          }
          let body
          try { body = JSON.parse(raw) } catch { return send(400, { ok: false, error: "Invalid JSON body." }) }
          if (!body || typeof body !== "object" || typeof body.releaseId !== "string" || !/^\d+$/.test(body.releaseId) ||
            !Number.isInteger(body.selectedTrackIndex) || body.selectedTrackIndex < -1 ||
            typeof body.selectedTrackTitle !== "string" || !body.selectedTrackTitle.trim() ||
            (body.customSearchQuery !== undefined && typeof body.customSearchQuery !== "string")) {
            return send(400, { ok: false, error: "Invalid track preferences." })
          }
          const save = async () => {
            const prefs = JSON.parse(await readFile(prefsPath, "utf8"))
            prefs[body.releaseId] = {
              selectedTrackIndex: body.selectedTrackIndex, selectedTrackTitle: body.selectedTrackTitle.trim(),
              ...(body.customSearchQuery?.trim() ? { customSearchQuery: body.customSearchQuery.trim() } : {}),
            }
            await writeFile(prefsPath, JSON.stringify(prefs, null, 2), "utf8")
          }
          const pending = queue.then(save)
          queue = pending.catch(() => {})
          await pending
          send(200, { ok: true })
        } catch { send(500, { ok: false, error: "Unable to save track preferences." }) }
      })
    },
  }
}
