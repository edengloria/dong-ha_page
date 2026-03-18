"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { NavigationItem } from "@/content/types"
import { cn } from "@/lib/utils"

function isRouteActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/"
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SiteNavbar({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="space-y-1.5" aria-label="Primary">
      {items.map((item) => {
        const isActive = isRouteActive(pathname, item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "block rounded-lg border border-transparent px-4 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "border-primary/25 bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                : "text-muted-foreground hover:border-border/80 hover:bg-background/35 hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
