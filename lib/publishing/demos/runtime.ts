import { angularSpectrumProfile, profilePoints } from './angular-spectrum-model'
export function mountDemos() {
  for (const element of document.querySelectorAll<HTMLElement>('[data-registered-demo="angular-spectrum"]')) {
    const wavelength = element.querySelector<HTMLInputElement>('[data-demo-wavelength]')!, distance = element.querySelector<HTMLInputElement>('[data-demo-distance]')!
    wavelength.disabled = false; distance.disabled = false
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        element.querySelector('[data-demo-profile]')!.setAttribute('points', profilePoints(angularSpectrumProfile(Number(wavelength.value), Number(distance.value))))
        element.querySelector('[data-demo-wavelength-label]')!.textContent = `${wavelength.value} nm`
        element.querySelector('[data-demo-distance-label]')!.textContent = `${distance.value} mm`
      })
    }
    wavelength.addEventListener('input', update); distance.addEventListener('input', update)
  }
}
