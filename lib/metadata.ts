import type { Metadata } from "next"
import { profile } from "@/content/profile"
import { siteConfig } from "@/content/site"
import { withBasePath } from "@/lib/utils"

type CreateMetadataOptions = {
  title?: string
  description?: string
  path?: string
}

export function createMetadata({
  title,
  description = siteConfig.description,
  path = "/",
}: CreateMetadataOptions = {}): Metadata {
  const resolvedTitle = title ? `${title} | ${profile.name}` : siteConfig.title
  const canonicalPath = path === "/" ? "/" : `${path.replace(/\/+$/, "")}/`
  const url = new URL(canonicalPath, siteConfig.url).toString()
  const image = withBasePath(siteConfig.ogImage)

  return {
    title: resolvedTitle,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: resolvedTitle,
      description,
      url,
      siteName: siteConfig.title,
      locale: siteConfig.locale,
      type: "website",
      images: [
        {
          url: image,
          alt: profile.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: [image],
    },
  }
}
