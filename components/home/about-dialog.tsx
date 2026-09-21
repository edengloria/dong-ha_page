"use client"

import { useRef } from "react"
import { profile } from "@/content/profile"
import { RichText } from "@/components/content/rich-text"

export function AboutDialog() {
  const dialog = useRef<HTMLDialogElement>(null)
  return <>
    <button className="meta-link about-trigger" onClick={() => dialog.current?.showModal()}>More about me ↗</button>
    <dialog ref={dialog} className="about-dialog" aria-labelledby="about-title" onClick={(event) => {
      if (event.target !== event.currentTarget) return
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close()
    }}>
      <div className="flex items-center justify-between gap-4">
        <h2 id="about-title" className="page-title">About me</h2>
        <button autoFocus className="icon-btn" aria-label="Close introduction" onClick={() => dialog.current?.close()}>×</button>
      </div>
      <div className="copy-stack">{profile.about.map((paragraph, index) => <p key={index} className="copy-paragraph"><RichText blocks={paragraph} /></p>)}</div>
    </dialog>
  </>
}
