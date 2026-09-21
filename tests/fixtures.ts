import { test as base, expect } from "@playwright/test"

// Exercise shader correctness on Linux CI without enabling software GPU rendering
// for visitors. Never use this mode for hardware-performance measurements.
export const test = base.extend<{ allowSoftwareWebGL: void }>({
  allowSoftwareWebGL: [async ({ context }, use) => {
    if (process.env.PLAYWRIGHT_ALLOW_SOFTWARE_WEBGL === "1") {
      await context.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext
        HTMLCanvasElement.prototype.getContext = function (
          this: HTMLCanvasElement, type: string, options?: unknown
        ) {
          if (type === "webgl2") {
            options = { ...(options as WebGLContextAttributes), failIfMajorPerformanceCaveat: false }
          }
          return Reflect.apply(original, this, [type, options])
        } as typeof original
      })
    }
    await use()
  }, { auto: true }],
})

export { expect }
