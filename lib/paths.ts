/**
 * Prefixes a public asset path with the Astro deployment base.
 * Expects `path` like "/asset/..." or "/placeholder.svg".
 */
export function withBasePath(path: string) {
  const basePath = (import.meta.env?.BASE_URL || "/").replace(/\/$/, "")
  if (!basePath) return path
  if (!path.startsWith("/")) return `${basePath}/${path}`
  return `${basePath}${path}`
}

/** Accept both logical document paths and deployment-prefixed browser paths. */
export function withoutBasePath(path: string) {
  const basePath = (import.meta.env?.BASE_URL || "/").replace(/\/$/, "")
  return basePath && (path === basePath || path.startsWith(`${basePath}/`)) ? path.slice(basePath.length) || "/" : path
}
