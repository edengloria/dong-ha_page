"use client"

import Image from "next/image"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useEffect, useState, type CSSProperties } from "react"
import defaultLayout from "@/data/scene-layout.json"
import { assetPath, layoutCss, parseLayout, SCENE_EVENT, SCENE_STORAGE, type SceneLayout } from "@/lib/scene-layout"
import { withBasePath } from "@/lib/utils"
import { BeamsBackgroundClient } from "@/components/layout/beams-background-client"

const SceneEditor = dynamic(() => import("@/components/scene/scene-editor"), { ssr: false })
const defaults = parseLayout(defaultLayout)
const asset = (file: string) => withBasePath(`/asset/camerons-world/${file}`)

export function OceanWorld() {
  const editing = usePathname().replace(/\/$/, "").endsWith("/scene-editor")
  const [layout, setLayout] = useState<SceneLayout>(defaults)
  useEffect(() => {
    const read = () => {
      try { const raw = localStorage.getItem(SCENE_STORAGE); setLayout(raw ? parseLayout(JSON.parse(raw)) : defaults) } catch { setLayout(defaults) }
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
    <div className="ocean-world" style={textures} aria-hidden="true">
      <div className="ocean-depth" /><div className="ocean-ripple" />
      <div className="ocean-light"><BeamsBackgroundClient /></div>
      <div className="sunset-sky" />
    </div>
    {[false, true].map((foreground) => <div key={String(foreground)} className={`scene-layer ${foreground ? "scene-foreground" : ""}`} aria-hidden="true">
      {layout.items.filter((item) => item.foreground === foreground).map((item, index) => <picture key={item.id} className={`scene-sprite ${item.id}`} style={{
        "--x": `${item.desktop.x}%`, "--y": `${item.desktop.y}px`, "--w": `${item.desktop.width}px`, "--r": `${item.desktop.rotation}deg`, "--show": item.desktop.hidden ? "none" : "block",
        "--mx": `${item.mobile.x}%`, "--my": `${item.mobile.y}px`, "--mw": `${item.mobile.width}px`, "--mr": `${item.mobile.rotation}deg`, "--mshow": item.mobile.hidden ? "none" : "block", zIndex: index,
      } as CSSProperties}>
        <source media="(prefers-reduced-motion: reduce)" srcSet={withBasePath(assetPath(item.still))} />
        <Image src={withBasePath(assetPath(item.file))} alt="" width={item.width} height={item.height} unoptimized />
      </picture>)}
    </div>)}
    {editing && <SceneEditor layout={layout} onChange={setLayout} defaults={defaults} />}
  </>
}
