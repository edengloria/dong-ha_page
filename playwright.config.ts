import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  use: {
    channel: process.env.PLAYWRIGHT_CHANNEL,
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3100",
    colorScheme: "dark",
    deviceScaleFactor: 1,
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: "npm run build && node scripts/serve-documents.mjs",
    env: { DOCUMENT_VISUAL_TEST: "1" },
    url: "http://127.0.0.1:3100",
    reuseExistingServer: true,
    timeout: 240_000,
  },
})
