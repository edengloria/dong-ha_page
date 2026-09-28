"use client"
import { withBasePath } from "@/lib/paths"
import { useScene } from "@/components/scene/scene-context"

const rows = [
  [{ label: "Home", href: "/" }],
  [{ label: "Publications", href: "/publications" }],
  [{ label: "Photos", href: "/gallery/photos" }, { label: "Vinyl", href: "/gallery/vinyl" }],
]

export function SiteNavbar() {
  const { pathname } = useScene()
  return <nav className="directory" aria-label="Primary"><ol>{rows.map((items, index) => <li key={index}>{items.map((item, linkIndex) => {
    const href = withBasePath(item.href)
    const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`)) || (item.href === "/gallery/vinyl" && pathname === "/gallery")
    return <span key={item.href}>{linkIndex > 0 && " / "}<a href={`${href.replace(/\/$/, "")}/`} aria-current={active ? "page" : undefined}>{item.label}</a></span>
  })}</li>)}</ol></nav>
}
