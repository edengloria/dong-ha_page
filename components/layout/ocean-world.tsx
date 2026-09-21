import Image from "next/image"
import type { CSSProperties } from "react"
import { withBasePath } from "@/lib/utils"
import { BeamsBackgroundClient } from "@/components/layout/beams-background-client"

const asset = (file: string) => withBasePath(`/asset/camerons-world/${file}`)

function Sprite({ file, width, height, className, animated = false }: {
  file: string; width: number; height: number; className: string; animated?: boolean
}) {
  return <picture className={`ocean-sprite ${className}`}>
    {animated && <source media="(prefers-reduced-motion: reduce)" srcSet={asset(`${file}.png`)} />}
    <Image src={asset(`${file}.${animated ? "gif" : "png"}`)} alt="" width={width} height={height} unoptimized />
  </picture>
}

export function OceanWorld() {
  const textures = {
    "--sunset": `url("${asset("10/bg.png")}")`,
    "--ocean": `url("${asset("11/bg.png")}")`,
    "--ripple": `url("${asset("12/bg.gif")}")`,
    "--ripple-still": `url("${asset("12/bg-still.png")}")`,
  } as CSSProperties
  return <div className="ocean-world" style={textures} aria-hidden="true">
    <div className="ocean-depth" />
    <div className="ocean-ripple" />
    <div className="ocean-light"><BeamsBackgroundClient /></div>
    <div className="sunset-sky">
      <Sprite file="10/6" width={600} height={131} className="sun-birds" animated />
      <Sprite file="10/5" width={149} height={203} className="palms" animated />
      <Sprite file="10/14" width={88} height={61} className="shore-bird" animated />
      <Sprite file="10/15" width={160} height={40} className="shark-fin" animated />
      <Sprite file="10/16" width={210} height={41} className="distant-dolphin" animated />
      <Sprite file="10/17" width={132} height={81} className="jumping-dolphins" />
    </div>
    <div className="ocean-life">
      <Sprite file="11/3" width={86} height={49} className="red-fish" />
      <Sprite file="11/24" width={74} height={64} className="green-fish" />
      <Sprite file="11/13" width={107} height={67} className="blue-dolphin" />
      <Sprite file="11/16" width={173} height={66} className="silver-fish" />
      <Sprite file="12/13" width={600} height={70} className="coral-reef" />
    </div>
  </div>
}
