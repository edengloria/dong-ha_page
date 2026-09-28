import { spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve, join } from 'node:path'
const root = resolve(import.meta.dirname, '..'), stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
const folder = resolve(root, 'backups'), archive = join(folder, `publishing-${stamp}.tar.gz`)
await mkdir(folder, { recursive: true })
const types = 'post,author,topic,tag,series,referenceRecord,siteSettings,blogComment,sanity.imageAsset,sanity.fileAsset'
const result = spawnSync(process.execPath, [join(root, 'node_modules/sanity/bin/sanity'), 'dataset', 'export', 'production', archive, '--types', types], { cwd: join(root, 'studio'), stdio: 'inherit', env: process.env })
if (result.status !== 0) throw new Error('CMS export failed')
const bytes = await readFile(archive)
await writeFile(`${archive}.sha256`, `${createHash('sha256').update(bytes).digest('hex')}  ${archive.split(/[\\/]/).pop()}\n`)
console.log(`Full content and original assets exported to ${archive}. Store a separate private off-device copy.`)
