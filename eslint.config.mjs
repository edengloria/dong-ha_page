import tseslint from "typescript-eslint"
import astro from "eslint-plugin-astro"
import hooks from "eslint-plugin-react-hooks"
import globals from "globals"
import { defineConfig } from "eslint/config"

export default defineConfig(
  { ignores: ["**/node_modules/**", "**/dist/**", "**/.astro/**", "**/.sanity/**", "out/**", ".next/**", ".visual-baseline/**", "test-results/**", "playwright-report/**", "public/**", "publishing/public/**", "next-env.d.ts"] },
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  { files: ["**/*.{ts,tsx}"], plugins: { "react-hooks": hooks }, rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
  } },
)
