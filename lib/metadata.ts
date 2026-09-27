import { profile } from "@/content/profile"
import { siteConfig } from "@/content/site"
import { withBasePath } from "@/lib/paths"

export type PageMetadata = { title?: string; description?: string; path?: string; noindex?: boolean }

export function createMetadata({ title, description = siteConfig.description, path = "/", noindex = false }: PageMetadata = {}) {
  const canonicalPath = path === "/" ? "/" : `${path.replace(/\/+$/, "")}/`
  return {
    title: title ? `${title} | ${profile.name}` : siteConfig.title,
    description,
    canonical: new URL(withBasePath(canonicalPath), siteConfig.url).href,
    image: new URL(withBasePath(siteConfig.ogImage), siteConfig.url).href,
    noindex,
  }
}
