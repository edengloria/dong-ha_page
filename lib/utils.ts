import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Prefixes a public asset path with Next.js `basePath` (useful for `output: "export"`).
 * Expects `path` like "/asset/..." or "/placeholder.svg".
 */
export function withBasePath(path: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
  if (!basePath) return path
  if (!path.startsWith("/")) return `${basePath}/${path}`
  return `${basePath}${path}`
}
