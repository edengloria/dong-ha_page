import { angularSpectrumProfile, demoParameters, profilePoints } from './angular-spectrum-model'
import type { DemoBlock } from '../types'
export function renderDemo(block: DemoBlock) {
  if (block.kind !== 'angular-spectrum') throw new Error('Unknown registered demo')
  const id = `demo-${block._key.replace(/[^a-zA-Z0-9_-]/g, '-')}`, { wavelength, distance } = demoParameters(block.wavelength, block.distance)
  return `<figure class="optical-demo" data-registered-demo="angular-spectrum">
    <figcaption><strong>1D Angular Spectrum propagation</strong><br>Scalar simulation · Gaussian input, waist 60 μm · 128 samples at 8 μm spacing.</figcaption>
    <svg viewBox="0 0 720 270" role="img" aria-labelledby="${id}-title"><title id="${id}-title">Intensity relative to the input peak; horizontal coordinate spans approximately −512 to 504 micrometers.</title><path d="M50 30V220H670" fill="none" stroke="currentColor"/><text x="20" y="40">1</text><text x="20" y="225">0</text><text x="50" y="250">−512 μm</text><text x="345" y="250">0</text><text x="610" y="250">504 μm</text><polyline data-demo-profile points="${profilePoints(angularSpectrumProfile(wavelength, distance))}" fill="none" stroke="#4d43a6" stroke-width="3"/></svg>
    <label for="${id}-wavelength">Wavelength <output data-demo-wavelength-label>${wavelength} nm</output></label><input id="${id}-wavelength" data-demo-wavelength type="range" min="380" max="780" step="1" value="${wavelength}" disabled>
    <label for="${id}-distance">Propagation distance <output data-demo-distance-label>${distance} mm</output></label><input id="${id}-distance" data-demo-distance type="range" min="0" max="120" step="1" value="${distance}" disabled>
    <p class="demo-limit">Periodic FFT window; no absorption or vector/polarization model. Curves share the input-peak normalization. This illustration is not an experimental measurement.</p><noscript>The initial simulated profile remains visible; enable JavaScript to adjust the parameters.</noscript>
  </figure>`
}
