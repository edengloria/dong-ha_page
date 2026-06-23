import { profile } from "@/content/profile"
import { siteConfig } from "@/content/site"

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-border/50 pt-6 text-center">
      <p className="text-xs text-muted-foreground/85">
        © {siteConfig.copyrightYear} {profile.name}
      </p>
    </footer>
  )
}
