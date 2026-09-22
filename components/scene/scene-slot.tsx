"use client"
import Image from "next/image"
import type { CSSProperties } from "react"
import reference from "@/data/scene-reference.json"
import optimized from "@/data/scene-optimized.json"
import { profile } from "@/content/profile"
import { useScene } from "./scene-context"
import { assetPath, type SceneAnchor, type SceneItem } from "@/lib/scene-layout"
import { sidebarPlacement } from "@/lib/scene-anchors"
import { withBasePath } from "@/lib/utils"
const blank = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
const links = { email: `mailto:${profile.email}`, research: "/publications/", photos: "/gallery/photos/", records: "/gallery/vinyl/" }
const labels = { email: "Email Dong-Ha", research: "Research publications", photos: "Photo diary", records: "Record collection" }
function Sprite({ item, mode, index }: { item: SceneItem; mode: "desktop" | "mobile"; index: number }) {
  const p = item[mode]
  const file = (optimized as Record<string, string>)[item.file] || item.file
  const media = mode === "desktop" ? "(min-width: 561px)" : "(max-width: 560px)"
  const width = p.size === "original" ? `${item.width}px` : p.size === "integer" ? `${item.width * (p.pixelScale || 1)}px`
    : p.anchor ? `min(${p.width}px, ${p.width / reference.boxes[p.anchor].width * 100}cqw)` : `${p.width}px`
  const style = { left: `${p.x}%`, top: `${p.y}${p.anchor ? "%" : "px"}`, width, transform: `translateX(-50%) rotate(${p.rotation}deg)`, zIndex: index,
    imageRendering: item.pixelated ? "pixelated" : "auto" } as CSSProperties
  const picture = <picture>
    <source media={`${media} and (prefers-reduced-motion: reduce)`} srcSet={withBasePath(assetPath(item.still))} />
    <source media={media} srcSet={withBasePath(assetPath(file))} />
    <Image src={blank} alt="" width={item.width} height={item.height} unoptimized loading="lazy" />
  </picture>
  const props = { className: `scene-sprite ${item.id}`, "data-anchor": p.anchor || "viewport", "data-scene-id": item.id, style }
  return item.link ? <a {...props} className={`${props.className} scene-image-link`} href={item.link === "email" ? links.email : withBasePath(links[item.link])} aria-label={labels[item.link]}>{picture}</a>
    : <span {...props} aria-hidden="true">{picture}</span>
}
// Public slots need no DOM measurement, including before hydration.
export function SceneSlot({ anchor }: { anchor?: SceneAnchor }) {
  const { layout, home } = useScene()
  return <span className={`scene-slot ${anchor ? "scene-slot-local" : "scene-slot-viewport"}`} data-scene-slot={anchor || "viewport"}>
    {(["desktop", "mobile"] as const).map((mode) => [false, true].map((front) => {
      const items = layout.items.map((item, index) => ({ item, index })).filter(({ item }) => !item[mode].hidden && item[mode].anchor === anchor &&
        (item.foreground && (home || sidebarPlacement(item[mode]))) === front)
      return items.length ? <span key={`${mode}-${front}`} className={`scene-layer scene-${mode}${front ? " scene-foreground" : ""}`}>
        {items.map(({ item, index }) => <Sprite key={item.id} item={item} mode={mode} index={index} />)}
      </span> : null
    }))}
  </span>
}
// Missing home sections keep their reference proportions behind inner pages.
export function HomeSceneFallback() {
  const { home } = useScene()
  if (home) return null
  const main = reference.boxes.main
  const size = (n: number) => `min(${n}px, ${n / main.width * 100}cqw)`
  return <span className="scene-home-fallback">
    {(["intro", "research", "photos", "records", "publications"] as const).map((anchor) => {
      const box = reference.boxes[anchor]
      return <span key={anchor} className="scene-fallback-region" style={{ left: size(box.left - main.left), top: size(box.top - main.top), width: size(box.width), height: size(box.height) }}>
        <SceneSlot anchor={anchor} />
      </span>
    })}
  </span>
}
