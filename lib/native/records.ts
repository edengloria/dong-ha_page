import { createPreviewSearchPlan, type PreviewData } from "@/lib/music-preview"
import { searchItunesPreview } from "@/lib/itunes-preview"

// One owner for pending searches, playback and fades; leaving invalidates all three.
export function mountRecords(root: ParentNode = document) {
  const lifetime = new AbortController()
  const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-record]"))
  const cache = new Map<string, PreviewData>()
  let active: HTMLElement | undefined, audio: HTMLAudioElement | undefined
  let search: AbortController | undefined, timer: ReturnType<typeof setTimeout> | undefined
  let request = 0, fade = 0
  const mobile = () => matchMedia("(max-width: 767px), (hover: none)").matches
  const state = (card: HTMLElement, label: string, action = "Play preview") => {
    card.querySelector("[data-preview-status]")!.textContent = label
    const button = card.querySelector<HTMLButtonElement>("[data-preview-button]")!
    button.textContent = action === "Stop preview" ? "Stop" : action === "Retry preview" ? "Retry" : "Play"
    button.setAttribute("aria-label", action)
    card.dataset.playing = String(action === "Stop preview")
  }
  const releaseAudio = () => {
    cancelAnimationFrame(fade)
    if (audio) { audio.onended = null; audio.onerror = null; audio.pause(); audio.removeAttribute("src"); audio.load(); audio = undefined }
  }
  const stop = () => {
    request++; clearTimeout(timer); search?.abort(); search = undefined; releaseAudio()
    if (active) state(active, "")
    active = undefined
  }
  const play = async (card: HTMLElement) => {
    const id = ++request
    search?.abort(); releaseAudio()
    if (active && active !== card) state(active, "")
    active = card
    state(card, "Searching…")
    const key = `${card.dataset.record}:${card.dataset.query}`
    let data = cache.get(key)
    if (!data) {
      const controller = new AbortController(); search = controller
      try {
        data = await searchItunesPreview(createPreviewSearchPlan({ album: card.dataset.album!, artist: card.dataset.artist!, preferredQuery: card.dataset.query || "", customQuery: card.dataset.customQuery }), controller.signal) || undefined
        if (id !== request || active !== card || controller.signal.aborted) return
        if (!data) { state(card, "No preview", "Retry preview"); return }
        cache.set(key, data)
      } catch {
        if (id === request && active === card && !controller.signal.aborted) state(card, "Search unavailable", "Retry preview")
        return
      }
    }
    if (id !== request || active !== card) return
    const player = new Audio(data.url); audio = player; player.volume = .01
    const failed = (error?: unknown) => {
      if (id !== request || audio !== player) return
      player.pause()
      const blocked = error instanceof DOMException && error.name === "NotAllowedError"
      state(card, blocked ? "Click Play to listen" : "Playback unavailable", blocked ? "Play preview" : "Retry preview")
    }
    player.onerror = () => failed()
    player.onended = () => { if (audio === player) { releaseAudio(); state(card, "") } }
    // Cached previews call play in the click event's activation window.
    player.play().then(() => {
      if (id !== request || audio !== player) { player.pause(); return }
      state(card, `${data!.trackName} — ${data!.artistName}`, "Stop preview")
      const start = performance.now()
      const step = (now: number) => {
        if (audio !== player) return
        const ratio = Math.min(1, (now - start) / 180)
        player.volume = .01 + ratio * .49
        if (ratio < 1) fade = requestAnimationFrame(step)
      }
      fade = requestAnimationFrame(step)
    }).catch(failed)
  }
  cards.forEach((card) => {
    const opts = { signal: lifetime.signal }
    const button = card.querySelector<HTMLButtonElement>("[data-preview-button]")!
    button.hidden = false
    card.addEventListener("pointerenter", () => {
      if (mobile() || active === card) return
      stop(); active = card; timer = setTimeout(() => { if (active === card) void play(card) }, 300)
    }, opts)
    card.addEventListener("pointerleave", () => { if (!mobile() && active === card) stop() }, opts)
    card.addEventListener("focusin", () => {
      if (!mobile() && active !== card) { stop(); active = card; timer = setTimeout(() => { if (active === card) void play(card) }, 300) }
    }, opts)
    card.addEventListener("focusout", (event) => { if (!mobile() && !card.contains(event.relatedTarget as Node) && active === card) stop() }, opts)
    button.addEventListener("click", () => { clearTimeout(timer); if (active === card && audio && !audio.paused) stop(); else void play(card) }, opts)
    card.querySelector<HTMLAnchorElement>(".record-cover")?.addEventListener("click", (event) => {
      if (!mobile() || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault(); clearTimeout(timer)
      if (active === card && audio && !audio.paused) stop(); else void play(card)
    }, opts)
  })
  window.addEventListener("pagehide", stop, { signal: lifetime.signal })
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop() }, { signal: lifetime.signal })
  return () => { stop(); lifetime.abort() }
}
