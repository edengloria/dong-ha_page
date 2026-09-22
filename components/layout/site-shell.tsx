import type { ReactNode } from "react"
import { SiteSidebar } from "@/components/layout/site-sidebar"
import { OceanWorld } from "@/components/layout/ocean-world"
import { SceneProvider } from "@/components/scene/scene-context"
import { SceneSlot, HomeSceneFallback } from "@/components/scene/scene-slot"

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <SceneProvider>
      <div className="site-viewport">
      <OceanWorld />

      <div className="relative z-10 min-h-svh">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>

        <div className="site-wrap ocean-content">
          <table className="site-grid" role="presentation"><tbody><tr>
            <td className="sidebar-cell"><SiteSidebar /></td>
            <td className="panel-gap" aria-hidden="true" />
            <td className="main-cell">
            <main id="main-content" className="min-w-0 flex-1">
              <div className="page-sheet"><SceneSlot anchor="main" /><HomeSceneFallback />{children}</div>
            </main>
            </td>
          </tr></tbody></table>
          <div className="ocean-credit"><SceneSlot anchor="footer" />Graphics from <a href="https://www.cameronsworld.net/" target="_blank" rel="noopener noreferrer">Cameron’s World / GeoCities archives</a></div>
        </div>
      </div>
      </div>
    </SceneProvider>
  )
}
