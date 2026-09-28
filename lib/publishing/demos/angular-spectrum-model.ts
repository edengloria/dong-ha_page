/** Scalar, 1D, periodic sampled-field ASM. SI internally; no evanescent components. */
const samples = 128, spacing = 8e-6, waist = 60e-6
const input = Array.from({ length: samples }, (_, x) => Math.exp(-1 * (((x - samples / 2) * spacing) / waist) ** 2))
const spectrum = input.map((_, k) => input.reduce((sum, value, x) => {
  const phase = -2 * Math.PI * k * x / samples
  return [sum[0] + value * Math.cos(phase), sum[1] + value * Math.sin(phase)]
}, [0, 0]))
export function demoParameters(wavelength = 532, distance = 30) {
  return { wavelength: Number.isFinite(wavelength) ? Math.max(380, Math.min(780, wavelength)) : 532, distance: Number.isFinite(distance) ? Math.max(0, Math.min(120, distance)) : 30 }
}
export function angularSpectrumProfile(wavelengthNm: number, distanceMm: number) {
  const parameters = demoParameters(wavelengthNm, distanceMm), wavelength = parameters.wavelength * 1e-9, z = parameters.distance * 1e-3
  const propagated = spectrum.map(([real, imaginary], k) => {
    const frequency = (k < samples / 2 ? k : k - samples) / (samples * spacing)
    const q = 1 / wavelength ** 2 - frequency ** 2
    if (q < 0) return [0, 0]
    // Remove a uniform carrier phase; intensity is unchanged.
    const phase = 2 * Math.PI * z * (Math.sqrt(q) - 1 / wavelength), c = Math.cos(phase), s = Math.sin(phase)
    return [real * c - imaginary * s, real * s + imaginary * c]
  })
  return input.map((_, x) => {
    const [real, imaginary] = propagated.reduce((sum, [a, b], k) => {
      const phase = 2 * Math.PI * k * x / samples, c = Math.cos(phase), s = Math.sin(phase)
      return [sum[0] + a * c - b * s, sum[1] + a * s + b * c]
    }, [0, 0])
    return (real ** 2 + imaginary ** 2) / samples ** 2
  })
}
export function profilePoints(profile: number[]) {
  return profile.map((value, i) => `${(50 + i / (samples - 1) * 620).toFixed(2)},${(220 - value * 185).toFixed(2)}`).join(' ')
}
