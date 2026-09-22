"use client"
import { withBasePath, withoutBasePath } from "@/lib/utils"
import { usePathname } from "next/navigation"
import type { NavigationItem } from "@/content/types"

export function SiteNavbar({ items }: { items: NavigationItem[] }) {
  const pathname = withoutBasePath(usePathname()).replace(/\/$/, "") || "/"
  return <nav className="directory" aria-label="Primary">{items.map((item, index) => {
    const href = withBasePath(item.href)
    const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`)) || (item.href === "/gallery/vinyl" && pathname === "/gallery")
    return <a key={item.href} href={`${href.replace(/\/$/, "")}/`} aria-current={active ? "page" : undefined}><span className="text-[10px]" aria-hidden="true">0{index + 1}</span>{item.label}</a>
  })}</nav>
}
