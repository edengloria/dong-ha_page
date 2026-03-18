import type { ReactNode } from "react"
import BeamsBackground from "@/components/kokonutui/beams-background"
import { SiteContainer } from "@/components/layout/site-container"
import { SiteSidebar } from "@/components/layout/site-sidebar"

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <BeamsBackground intensity="medium" />
      </div>

      <div className="relative z-10 min-h-svh">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>

        <SiteContainer className="py-6 lg:py-8">
          <div className="site-grid">
            <SiteSidebar />

            <main id="main-content" className="min-w-0 flex-1">
              <div className="glass-panel min-h-[calc(100svh-3rem)]">{children}</div>
            </main>
          </div>
        </SiteContainer>
      </div>
    </>
  )
}
