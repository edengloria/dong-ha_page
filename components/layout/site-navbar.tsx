"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { NavigationItem } from "@/content/types"

export function SiteNavbar({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname().replace(/\/$/, "") || "/"
  return <nav className="directory" aria-label="Primary">{items.map((item, index) => {
    const active = pathname === item.href || (item.href === "/gallery/vinyl" && pathname === "/gallery")
    return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}><span className="text-[10px]" aria-hidden="true">0{index + 1}</span>{item.label}</Link>
  })}</nav>
}
