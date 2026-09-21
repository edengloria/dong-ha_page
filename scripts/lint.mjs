import { spawnSync } from "node:child_process"

const result = spawnSync(process.execPath, ["node_modules/eslint/bin/eslint.js", ".", "--ext", ".js,.jsx,.ts,.tsx", "--max-warnings=0"], {
  stdio: "inherit",
  env: { ...process.env, ESLINT_USE_FLAT_CONFIG: "false" },
})
process.exit(result.status ?? 1)
