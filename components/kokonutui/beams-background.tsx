"use client"
import { useEffect, useRef } from "react"
import { mountBeams } from "@/lib/native/beams"

export default function BeamsBackground() {
  const hostRef = useRef<HTMLDivElement>(null)
  useEffect(() => mountBeams(hostRef.current!), [])
  return <div ref={hostRef} className="beam-stage" data-renderer="loading" aria-hidden="true" />
}
