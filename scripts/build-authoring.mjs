import { spawnSync } from 'node:child_process'
import { cp, mkdir, readFile, readdir, writeFile, rm } from 'node:fs/promises'
import { resolve, join } from 'node:path'
const root = resolve(import.meta.dirname, '..')
async function cleanGenerated(relativePath) {
  if (!['publishing/public/studio', '.vercel/output'].includes(relativePath)) throw new Error('Unexpected generated target')
  const target = resolve(root, relativePath)
  if (!target.startsWith(`${root}${process.platform === 'win32' ? '\\' : '/'}`)) throw new Error('Generated target escaped workspace')
  await rm(target, { recursive: true, force: true })
}
const run = (args, cwd) => {
  const result = spawnSync(process.execPath, args, { cwd, stdio: 'inherit', env: process.env })
  if (result.status !== 0) throw new Error(`Authoring build failed (${result.status})`)
}
process.env.SANITY_STUDIO_BASEPATH = '/studio'
process.env.SANITY_STUDIO_PREVIEW_ORIGIN = 'https://studio.dhsh.in'
run([join(root, 'node_modules/sanity/bin/sanity'), 'build'], join(root, 'studio'))
await cleanGenerated('publishing/public/studio')
await mkdir(join(root, 'publishing/public/studio'), { recursive: true })
await cp(join(root, 'studio/dist'), join(root, 'publishing/public/studio'), { recursive: true })
const studioIndex = join(root, 'publishing/public/studio/index.html')
await writeFile(studioIndex, (await readFile(studioIndex, 'utf8')).replaceAll('href="/static/', 'href="/studio/static/'))
run([join(root, 'node_modules/astro/bin/astro.mjs'), 'build'], join(root, 'publishing'))
// Vercel's API/CLI uploads the Build Output API folder from the repository root.
if (process.env.VERCEL === '1') {
  await cleanGenerated('.vercel/output')
  await cp(join(root, 'publishing/.vercel/output'), join(root, '.vercel/output'), { recursive: true })
  const path = join(root, '.vercel/output/config.json'), config = JSON.parse(await readFile(path, 'utf8'))
  config.routes.unshift({ src: '^/(.*)$', headers: { 'X-Robots-Tag': 'noindex, nofollow, noarchive', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' }, continue: true }, { src: '^/$', status: 307, headers: { Location: '/studio/' } })
  const filesystem = config.routes.findIndex(route => route.handle === 'filesystem')
  if (filesystem < 0) throw new Error('Expected Vercel filesystem routing before Studio fallback')
  config.routes.splice(filesystem + 1, 0, { src: '^/studio(?:/.*)?$', dest: '/studio/index.html' })
  await writeFile(path, JSON.stringify(config, null, 2))
}
// Inspect only browser artifacts; server function bundles are allowed secrets.
const roots = [join(root, 'studio/dist'), join(root, 'publishing/dist/client'), join(root, '.vercel/output/static')]
const localEnv = await readFile(join(root, 'publishing/.env.local'), 'utf8').catch(() => '')
const secrets = ['SANITY_READ_TOKEN', 'SANITY_DEPLOY_TOKEN', 'GITHUB_DEPLOY_TOKEN', 'SANITY_WEBHOOK_SECRET', 'PREVIEW_SESSION_SECRET', 'DEPLOY_CALLBACK_SECRET'].flatMap(name => [process.env[name], localEnv.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1].trim()]).filter(Boolean)
async function check(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true }).catch(() => [])) {
    const path = join(folder, entry.name)
    if (entry.isDirectory()) await check(path)
    else if (/\.(html|js|json|css|map)$/.test(entry.name)) {
      const text = await readFile(path, 'utf8')
      if (secrets.some(secret => text.includes(secret))) throw new Error(`Secret leaked into browser artifact: ${path}`)
    }
  }
}
for (const folder of roots) await check(folder)
console.log(`Authoring application built; browser artifacts checked against ${new Set(secrets).size} configured secrets.`)
