import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import { documentAudit } from "./scripts/document-audit.mjs"
import { preferencesServer } from "./scripts/preferences-server.mjs"
import { publishingOutput } from "./scripts/publishing-output.mjs"

const fixture = process.env.DOCUMENT_VISUAL_TEST === "1"
const base = process.env.PUBLIC_BASE_PATH || "/"
if (fixture && process.env.GITHUB_WORKFLOW === "Deploy to GitHub Pages") throw new Error("Visual fixture builds cannot be deployed")

export default defineConfig({
  site: "https://dhsh.in",
  base,
  output: "static",
  outDir: "./out",
  trailingSlash: "always",
  build: { assets: "scripts", inlineStylesheets: "never" },
  integrations: [react(), documentAudit(fixture), publishingOutput()],
  vite: {
    define: { __VISUAL_FIXTURE__: JSON.stringify(fixture) },
    plugins: [preferencesServer(base)],
  },
})
