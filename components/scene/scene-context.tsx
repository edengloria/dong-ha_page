"use client"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import defaultLayout from "@/data/scene-layout.json"
import { layoutCss, parseLayout, SCENE_EVENT, SCENE_STORAGE, type SceneLayout } from "@/lib/scene-layout"
import { migrateMobileScene } from "@/lib/migrate-mobile-scene"
import { migrateAnchors } from "@/lib/scene-anchors"
import { withBasePath } from "@/lib/utils"
const defaults = parseLayout(defaultLayout)
const SceneContext = createContext({ layout: defaults, setLayout: (() => {}) as (layout: SceneLayout) => void, home: true, editing: false })
export const useScene = () => useContext(SceneContext)
export function SceneProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname().replace(/\/$/, "")
  const editing = pathname === withBasePath("/scene-editor")
  const home = editing || pathname === withBasePath("/").replace(/\/$/, "")
  const [layout, setLayout] = useState(defaults)
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(SCENE_STORAGE)
        const saved = raw ? parseLayout(JSON.parse(raw)) : defaults
        const next = raw ? migrateAnchors(migrateMobileScene(saved, defaults), defaults) : defaults
        setLayout(next)
        if (next !== saved) { try { localStorage.setItem(SCENE_STORAGE, JSON.stringify(next)) } catch {} }
      } catch { setLayout(defaults) }
    }
    read()
    const stored = (event: StorageEvent) => { if (event.key === SCENE_STORAGE || event.key === null) read() }
    window.addEventListener("storage", stored)
    window.addEventListener(SCENE_EVENT, read)
    return () => { window.removeEventListener("storage", stored); window.removeEventListener(SCENE_EVENT, read) }
  }, [editing])
  return <SceneContext.Provider value={{ layout, setLayout, home, editing }}>
    <style>{layoutCss(layout)}</style>{children}
  </SceneContext.Provider>
}
export { defaults }
