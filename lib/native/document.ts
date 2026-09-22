import { mountBeams } from "./beams"

const host = document.querySelector<HTMLElement>(".beam-stage")
if (host) mountBeams(host)
if (document.querySelector("[data-photo-index]")) import("./photos").then(({ mountPhotos }) => mountPhotos()).catch(() => {})
if (document.querySelector("[data-record]")) import("./records").then(({ mountRecords }) => {
  mountRecords()
  document.documentElement.classList.add("has-previews")
}).catch(() => {})

// Ordinary visitors use the already rendered scene. Only a saved editor preview
// loads the scene data and migration code; the editor/catalog never ship here.
let scene: Promise<void> | undefined
const savedScene = () => {
  try {
    if (!scene && localStorage.getItem("dongha-scene-v1")) scene = import("./scene").then(({ mountSavedScene }) => mountSavedScene()).catch(() => { scene = undefined })
  } catch { /* The document remains usable when storage is disabled. */ }
}
savedScene()
window.addEventListener("storage", savedScene)
window.addEventListener("dongha-scene-change", savedScene)
