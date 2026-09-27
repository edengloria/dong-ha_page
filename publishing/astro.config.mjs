import { defineConfig } from 'astro/config'
import node from '@astrojs/node'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  root: fileURLToPath(new URL('./', import.meta.url)),
  site: 'https://studio.dhsh.in',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'always',
  vite: { server: { fs: { allow: [fileURLToPath(new URL('../', import.meta.url))] } } },
})
