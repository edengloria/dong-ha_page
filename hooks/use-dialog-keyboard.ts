"use client"
import { useEffect, useRef } from "react"

export function useDialogKeyboard(open: boolean, close: () => void, previous?: () => void, next?: () => void) {
  const callbacks = useRef({ close, previous, next })
  callbacks.current = { close, previous, next }
  useEffect(() => {
    if (!open) return
    const active = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const dialog = document.querySelector<HTMLElement>("[data-retro-dialog]")
    const controls = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]') ?? [])
    controls()[0]?.focus()
    const keydown = (event: KeyboardEvent) => {
      const { close, previous, next } = callbacks.current
      if (event.key === "Escape") { event.preventDefault(); close() }
      if (event.key === "ArrowLeft" && previous) { event.preventDefault(); previous() }
      if (event.key === "ArrowRight" && next) { event.preventDefault(); next() }
      if (event.key === "Tab") {
        const items = controls()
        const first = items[0], last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener("keydown", keydown)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener("keydown", keydown)
      active?.focus()
    }
  }, [open])
}
