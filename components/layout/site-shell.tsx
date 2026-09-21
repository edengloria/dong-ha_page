import type { ReactNode } from "react"
import { SiteSidebar } from "@/components/layout/site-sidebar"
import { OceanWorld } from "@/components/layout/ocean-world"

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <OceanWorld />

      <div className="relative z-10 min-h-svh">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>

        <div className="site-wrap ocean-content">
          <div className="site-grid">
            <SiteSidebar />

            <main id="main-content" className="min-w-0 flex-1">
              <div className="page-sheet">{children}</div>
            </main>
          </div>
          <p className="ocean-credit">Graphics from <a href="https://www.cameronsworld.net/" target="_blank" rel="noopener noreferrer">Cameron’s World / GeoCities archives</a></p>
        </div>
      </div>
    </>
  )
}
