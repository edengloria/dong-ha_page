export function mountPhotos(root: ParentNode = document) {
  const photos = Array.from(root.querySelectorAll<HTMLAnchorElement>("a.photo-print"))
  const abort = new AbortController()
  let dialog: HTMLDialogElement | undefined
  const open = (index: number, opener: HTMLElement) => {
    dialog?.close()
    const viewer = document.createElement("dialog")
    dialog = viewer
    viewer.className = "document-viewer"
    viewer.setAttribute("aria-label", "Photo viewer")
    viewer.innerHTML = '<div class="viewer-content"><div class="window-strip"><span>Photo viewer</span><button type="button" aria-label="Close photo viewer">Close [×]</button></div><img alt=""><div class="viewer-controls"><button type="button" aria-label="Show previous photo">&lt; Previous</button><span aria-live="polite"></span><button type="button" aria-label="Show next photo">Next &gt;</button></div></div>'
    const img = viewer.querySelector("img")!
    const count = viewer.querySelector("[aria-live]")!
    const show = (next: number) => {
      index = (next + photos.length) % photos.length
      img.src = photos[index].href
      img.alt = photos[index].querySelector("img")?.alt || "Photo"
      count.textContent = `${index + 1} / ${photos.length}`
    }
    viewer.querySelector('[aria-label="Close photo viewer"]')!.addEventListener("click", () => viewer.close())
    viewer.querySelector('[aria-label="Show previous photo"]')!.addEventListener("click", () => show(index - 1))
    viewer.querySelector('[aria-label="Show next photo"]')!.addEventListener("click", () => show(index + 1))
    viewer.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); show(index + (event.key === "ArrowRight" ? 1 : -1)) }
    })
    viewer.addEventListener("click", (event) => { if (event.target === viewer) viewer.close() })
    viewer.addEventListener("close", () => { viewer.remove(); if (dialog === viewer) dialog = undefined; opener.focus({ preventScroll: true }) }, { once: true })
    show(index)
    document.body.append(viewer)
    viewer.showModal()
  }
  photos.forEach((photo, index) => photo.addEventListener("click", (event) => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (typeof HTMLDialogElement === "undefined" || !HTMLDialogElement.prototype.showModal) return
    event.preventDefault(); open(index, photo)
  }, { signal: abort.signal }))
  return () => { abort.abort(); dialog?.close() }
}
