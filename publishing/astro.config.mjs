import { defineConfig } from 'astro/config'
import node from '@astrojs/node'
import vercel from '@astrojs/vercel'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

// Node and Vercel use runtime process.env. Local secrets never enter Vite's
// browser environment, and the file is excluded from every deployment upload.
const localEnv = fileURLToPath(new URL('./.env.local', import.meta.url))
if (existsSync(localEnv)) process.loadEnvFile(localEnv)

export default defineConfig({
  root: fileURLToPath(new URL('./', import.meta.url)),
  site: 'https://studio.dhsh.in',
  output: 'server',
  adapter: process.env.VERCEL === '1' ? vercel() : node({ mode: 'standalone' }),
  trailingSlash: 'always',
  // The public dhsh.in form posts to this separate origin. Middleware retains
  // the same-origin form check elsewhere; comments also enforce their allowlist.
  security: { checkOrigin: false },
  vite: { server: { fs: { allow: [fileURLToPath(new URL('../', import.meta.url))] } } },
})
