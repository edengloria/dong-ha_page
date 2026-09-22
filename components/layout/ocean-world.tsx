"use client"

import Image from "next/image"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useEffect, useState, type CSSProperties } from "react"
import defaultLayout from "@/data/scene-layout.json"
import { assetPath, layoutCss, parseLayout, SCENE_EVENT, SCENE_STORAGE, type SceneLayout } from "@/lib/scene-layout"
import { withBasePath } from "@/lib/utils"
import { BeamsBackgroundClient } from "@/components/layout/beams-background-client"
import { migrateMobileScene } from "@/lib/migrate-mobile-scene"
import { migrateAnchors, resolvePlacement, sidebarPlacement } from "@/lib/scene-anchors"
import { useSceneAnchors } from "@/components/scene/use-scene-anchors"

const SceneEditor = dynamic(() => import("@/components/scene/scene-editor"), { ssr: false })
const defaults = parseLayout(defaultLayout)
const asset = (file: string) => withBasePath(`/asset/camerons-world/${file}`)

export function OceanWorld() {
  const pathname = usePathname().replace(/\/$/, "")
  const editing = pathname === withBasePath("/scene-editor")
  const showForeground = editing || pathname === withBasePath("/").replace(/\/$/, "")
  const [layout, setLayout] = useState<SceneLayout>(defaults)
  const geometry = useSceneAnchors(pathname, layout)
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(SCENE_STORAGE)
        const saved = raw ? parseLayout(JSON.parse(raw)) : defaults
        const next = raw ? migrateAnchors(migrateMobileScene(saved, defaults), defaults) : defaults
        setLayout(next)
        if (next !== saved) {
          try { localStorage.setItem(SCENE_STORAGE, JSON.stringify(next)) } catch { /* Still show the corrected layout if storage is full. */ }
        }
      } catch { setLayout(defaults) }
    }
    read()
    const stored = (event: StorageEvent) => { if (event.key === SCENE_STORAGE || event.key === null) read() }
    window.addEventListener("storage", stored)
    window.addEventListener(SCENE_EVENT, read)
    return () => { window.removeEventListener("storage", stored); window.removeEventListener(SCENE_EVENT, read) }
  }, [editing])
  const textures = {
    "--sunset": `url("${asset("10/bg.png")}")`, "--ocean": `url("${asset("11/bg.png")}")`,
    "--ripple": `url("${asset("12/bg.gif")}")`, "--ripple-still": `url("${asset("12/bg-still.png")}")`,
  } as CSSProperties
  return <>
    <style>{layoutCss(layout)}</style>
    <div className="ocean-world" style={textures} aria-hidden="true" data-scene-ready={Boolean(geometry.boxes.sky)}>
      <div className="ocean-depth" /><div className="ocean-ripple" />
      <div className="ocean-light"><BeamsBackgroundClient /></div>
      <div className="sunset-sky" />
    </div>
    {[false, true].map((foreground) => <div key={String(foreground)} className={`scene-layer ${foreground ? "scene-foreground" : ""}`} aria-hidden="true">
      {layout.items.filter((item) => (item.foreground && (showForeground || sidebarPlacement(item[geometry.mobile ? "mobile" : "desktop"]))) === foreground).map((item, index) => {
        const desktop = resolvePlacement(item.desktop, geometry.boxes, geometry.viewport)
        const mobile = resolvePlacement(item.mobile, geometry.boxes, geometry.viewport)
        return <picture key={item.id} className={`scene-sprite ${item.id}`} data-anchor={item[geometry.mobile ? "mobile" : "desktop"].anchor || "viewport"} style={{
        "--x": item.desktop.anchor ? `${desktop.left}px` : `${item.desktop.x}%`, "--y": `${desktop.top}px`, "--w": `${desktop.width}px`, "--r": `${item.desktop.rotation}deg`, "--show": item.desktop.hidden ? "none" : "block",
        "--mx": item.mobile.anchor ? `${mobile.left}px` : `${item.mobile.x}%`, "--my": `${mobile.top}px`, "--mw": `${mobile.width}px`, "--mr": `${item.mobile.rotation}deg`, "--mshow": item.mobile.hidden ? "none" : "block", zIndex: index,
      } as CSSProperties}>
        <source media="(prefers-reduced-motion: reduce)" srcSet={withBasePath(assetPath(item.still))} />
        <Image src={withBasePath(assetPath(item.file))} alt="" width={item.width} height={item.height} unoptimized />
      </picture>})}
    </div>)}
    {editing && <SceneEditor layout={layout} onChange={setLayout} defaults={defaults} geometry={geometry} />}
  </>
}
