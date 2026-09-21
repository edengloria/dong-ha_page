import Image from "next/image"
import { profile } from "@/content/profile"
import { primaryNavigation } from "@/content/site"
import { withBasePath } from "@/lib/utils"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteNavbar } from "@/components/layout/site-navbar"

export function SiteSidebar() {
  return <aside className="desk-sidebar">
    <div className="window-strip"><span>dong-ha / home</span><span aria-hidden="true">− □ ×</span></div>
    <div className="sidebar-body">
      <div className="portrait-print"><div className="relative aspect-square"><Image src={withBasePath(profile.portrait)} alt={profile.heroAlt} fill priority className="object-cover" sizes="160px" /></div></div>
      <div><p className="sidebar-name">{profile.name}<br /><span className="text-sm font-normal">신동하</span></p><p className="sidebar-role">{profile.role}<br />{profile.location}</p></div>
      <a className="meta-link text-[11px] break-all" href={`mailto:${profile.email}`}>{profile.email}</a>
      <SiteNavbar items={primaryNavigation} />
      <div className="sidebar-extras">
        <p className="eyebrow mb-2">Elsewhere on the web</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">{profile.socialLinks.map((link) => <a className="meta-link py-1" key={link.label} href={link.external ? link.href : withBasePath(link.href)} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>)}</div>
        <div className="web-badges"><span>OPTICS + AI</span><span>33⅓ RPM</span></div>
        <SiteFooter />
      </div>
    </div>
  </aside>
}
