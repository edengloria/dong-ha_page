export type RichTextSegment =
  | {
      type: "text"
      value: string
    }
  | {
      type: "link"
      label: string
      href: string
    }

export type RichTextBlock = RichTextSegment[]

export interface NavigationItem {
  label: string
  href: string
}

export interface SocialLink {
  label: string
  href: string
  icon: "cv" | "github" | "linkedin" | "instagram"
  external?: boolean
}

export interface ProfileContent {
  name: string
  nativeName: string
  role: string
  email: string
  location: string
  portrait: string
  heroAlt: string
  about: RichTextBlock[]
  socialLinks: SocialLink[]
}

export interface PublicationLink {
  label: string
  href: string
}

export interface Publication {
  kind: "Open-source" | "Journals"
  title: string
  authors: string
  venue: string
  note?: string
  image: string
  links: PublicationLink[]
}

export interface ProjectContent {
  slug: string
  title: string
  summary: string
  description: string[]
  tags: string[]
  year: string
  status: "draft" | "published"
  links?: PublicationLink[]
}
