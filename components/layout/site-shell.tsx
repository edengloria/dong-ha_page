import type { ReactNode } from "react"
import { SiteSidebar } from "@/components/layout/site-sidebar"
import { BeamsBackgroundClient } from "@/components/layout/beams-background-client"

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <BeamsBackgroundClient />
      </div>

      <div className="relative z-10 min-h-svh">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>

        <div className="site-wrap">
          <div className="site-grid">
            <SiteSidebar />

            <main id="main-content" className="min-w-0 flex-1">
              <div className="page-sheet">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
