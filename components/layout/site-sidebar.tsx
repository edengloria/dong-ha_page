import Image from "next/image"
import { FileText, Github, Instagram, Linkedin, Mail, MapPin } from "lucide-react"
import { profile } from "@/content/profile"
import { primaryNavigation } from "@/content/site"
import { withBasePath } from "@/lib/utils"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteNavbar } from "@/components/layout/site-navbar"

const socialIcons = {
  cv: FileText,
  github: Github,
  linkedin: Linkedin,
  instagram: Instagram,
} as const

export function SiteSidebar() {
  return (
    <aside className="w-full flex-shrink-0 lg:w-80 lg:sticky lg:top-6 lg:self-start">
      <div className="glass-panel">
        <div className="mb-6 flex justify-center">
          <div className="surface-frame relative h-40 w-40 overflow-hidden rounded-full lg:h-48 lg:w-48">
            <Image
              src={withBasePath(profile.portrait)}
              alt={profile.heroAlt}
              fill
              priority
              fetchPriority="high"
              className="object-cover"
              sizes="(max-width: 1024px) 10rem, 12rem"
            />
          </div>
        </div>

        <div
          className="mb-6 text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "300ms" }}
        >
          <h1 className="mb-1 text-2xl font-medium tracking-tight text-foreground lg:text-3xl">
            {profile.name}
          </h1>
          <p className="text-sm text-muted-foreground/90">{profile.role}</p>
        </div>

        <div
          className="mb-8 space-y-3 text-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "400ms" }}
        >
          <div className="flex items-center text-muted-foreground transition-colors hover:text-foreground">
            <Mail className="mr-3 h-4 w-4 flex-shrink-0 text-primary" />
            <a href={`mailto:${profile.email}`} className="truncate hover:text-foreground">
              {profile.email}
            </a>
          </div>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="mr-3 h-4 w-4 flex-shrink-0 text-primary" />
            <span>{profile.location}</span>
          </div>
        </div>

        <div
          className="mb-8 flex justify-center gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "500ms" }}
        >
          {profile.socialLinks.map((link) => {
            const Icon = socialIcons[link.icon]
            const href = link.external ? link.href : withBasePath(link.href)

            return (
              <a
                key={link.label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="icon-btn"
              >
                <Icon className="h-5 w-5" />
              </a>
            )
          })}
        </div>

        <div className="mb-6 border-t border-border/50" />

        <div
          className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "600ms" }}
        >
          <SiteNavbar items={primaryNavigation} />
        </div>

        <div
          className="animate-in fade-in-0 duration-500"
          style={{ animationDelay: "700ms" }}
        >
          <SiteFooter />
        </div>
      </div>
    </aside>
  )
}
