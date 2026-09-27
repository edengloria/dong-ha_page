"use client"
import SceneEditor from "@/components/scene/scene-editor"
import { useEffect, useState, type CSSProperties } from "react"
import { withBasePath } from "@/lib/paths"
import { BeamsBackgroundClient } from "@/components/layout/beams-background-client"
import { useScene } from "@/components/scene/scene-context"
import { SceneSlot } from "@/components/scene/scene-slot"
const asset = (file: string) => withBasePath(`/asset/camerons-world/${file}`)
export function OceanWorld() {
  const { editing } = useScene()
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])
  const textures = {
    "--sunset": `url("${asset("10/bg.png")}")`, "--ocean": `url("${asset("11/bg.png")}")`,
    "--ripple": `url("${asset("12/bg.gif")}")`, "--ripple-still": `url("${asset("12/bg-still.png")}")`,
  } as CSSProperties
  return <>
    <div className="ocean-world" style={textures} data-scene-ready="true">
      <div className="ocean-depth" aria-hidden="true" />
      <div className="sea-region"><div className="ocean-ripple" aria-hidden="true" /><SceneSlot anchor="sea" /></div>
      <div className="ocean-light" aria-hidden="true"><BeamsBackgroundClient /></div>
      <div className="sky-region"><div className="sunset-sky" aria-hidden="true" /><SceneSlot anchor="sky" /></div>
    </div>
    <SceneSlot />
    {editing && ready && <SceneEditor />}
  </>
}
