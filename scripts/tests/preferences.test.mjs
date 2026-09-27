import test from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { preferencesServer } from "../preferences-server.mjs"

test("dev preferences middleware validates requests and serializes saves under a base path", async () => {
  const root = await mkdtemp(join(tmpdir(), "dongha-preferences-"))
  await mkdir(join(root, "data"))
  const file = join(root, "data", "track-preferences.json")
  await writeFile(file, '{"42":{"selectedTrackIndex":0,"selectedTrackTitle":"Existing"}}')
  let handler
  preferencesServer("/subpath/").configureServer({ config: { root, base: "/" }, middlewares: { use: fn => { handler = fn } } })
  const server = createServer((req, res) => {
    req.originalUrl = req.url
    req.url = req.url.replace(/^\/subpath/, "")
    handler(req, res, () => res.writeHead(404).end())
  })
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  const post = (body, headers = {}) => fetch(`${origin}/subpath/api/save-preferences`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) })
  try {
    assert.equal((await fetch(`${origin}/api/save-preferences`)).status, 404)
    assert.equal((await fetch(`${origin}/subpath/api/save-preferences`)).status, 405)
    assert.equal((await post({}, { Origin: "https://example.com" })).status, 403)
    assert.equal((await post({ releaseId: "__proto__", selectedTrackIndex: 0, selectedTrackTitle: "Bad" })).status, 400)
    assert.equal((await post({ releaseId: "1", selectedTrackIndex: 0.5, selectedTrackTitle: "Bad" })).status, 400)
    assert.equal((await post({ releaseId: "1", selectedTrackIndex: 0, selectedTrackTitle: "x".repeat(17000) })).status, 413)
    const results = await Promise.all([1, 2].map(id => post({ releaseId: String(id), selectedTrackIndex: 0, selectedTrackTitle: ` Track ${id} `, customSearchQuery: " Search " }, { Origin: origin })))
    assert.ok(results.every(response => response.ok))
    const prefs = JSON.parse(await readFile(file, "utf8"))
    assert.deepEqual(Object.keys(prefs).sort(), ["1", "2", "42"])
    assert.equal(prefs["1"].selectedTrackTitle, "Track 1")
    assert.equal(prefs["2"].customSearchQuery, "Search")
    await writeFile(file, "invalid JSON")
    assert.equal((await post({ releaseId: "1", selectedTrackIndex: 0, selectedTrackTitle: "Track" })).status, 500)
    assert.equal(await readFile(file, "utf8"), "invalid JSON")
  } finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
    // root is the unique mkdtemp directory created by this test.
    await rm(root, { recursive: true, force: true })
  }
})
