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
    <aside className="w-full flex-shrink-0 lg:w-80">
      <div className="glass-panel animate-in fade-in-0 slide-in-from-left-4 duration-500">
        <div
          className="mb-6 flex justify-center animate-in fade-in-0 slide-in-from-bottom-3 duration-500"
          style={{ animationDelay: "200ms" }}
        >
          <div className="relative h-40 w-40 overflow-hidden rounded-full border border-primary/60 shadow-[0_18px_40px_rgba(13,19,34,0.35)] lg:h-48 lg:w-48">
            <Image
              src={withBasePath(profile.portrait)}
              alt={profile.heroAlt}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 10rem, 12rem"
            />
          </div>
        </div>

        <div
          className="mb-6 text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "300ms" }}
        >
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
            {profile.name}
          </h1>
          <p className="text-sm text-muted-foreground/95">{profile.role}</p>
        </div>

        <div
          className="mb-8 space-y-3 text-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "400ms" }}
        >
          <div className="flex items-center text-muted-foreground transition-colors hover:text-foreground">
            <Mail className="mr-3 h-4 w-4 flex-shrink-0 text-primary" />
            <a href={`mailto:${profile.email}`} className="truncate">
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
                className="rounded-full border border-border/70 bg-background/35 p-2 text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:bg-primary/12 hover:text-foreground"
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
