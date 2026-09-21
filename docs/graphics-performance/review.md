# PR #6 review and Linux screenshot validation

Reviewed the renderer and lifecycle changes from `6ed8887` to `88a4ad8` on
2026-09-21. The follow-up changes strengthen tests; production rendering code,
current Discogs data, and the existing screenshot baselines are unchanged.

## Screenshot results

Ubuntu 24.04 / WSL, Node 22.22.2, Playwright 1.51.1 and its Chromium 134 build.
All comparisons used the committed Linux images, the existing 0.005 pixel-ratio
tolerance, and `--update-snapshots=none`.

| Code and inputs | Renderer | Passed | Failed |
| --- | --- | ---: | ---: |
| Base `6ed8887`, current Discogs data | Canvas 2D | 9 | 6 |
| PR `88a4ad8`, current Discogs data | Canvas 2D fallback | 9 | 6 |
| PR with strengthened tests, current Discogs data | WebGL2, test-only software context | 9 | 6 |
| Same PR, snapshot-era Discogs data in an isolated checkout | WebGL2, test-only software context | 15 | 0 |

The same six comparisons fail on base and PR: `/gallery` and `/gallery/vinyl`
at mobile, tablet and desktop sizes. `/`, `/publications`, and `/gallery/photos`
pass at all three sizes. The failed diffs show changed record covers, labels,
ordering and count. The snapshots were last updated at `8d1f6c3` on June 25;
their Discogs input was fetched June 22 and contained 56 records. Current data
was fetched September 21 and contains 57 records.

Replacing **only** the Discogs JSON with the version from `8d1f6c3` in the
temporary Linux checkout makes all 15 existing comparisons pass, with WebGL2
explicitly required. The latest JSON was restored afterward. This establishes
that the six current-input failures are baseline/data drift, not evidence of a
graphics regression. It does not make the default current-data suite green.
No snapshot was updated and no production data was rolled back.

## Review findings addressed

1. **P2: Renderer failure could be mistaken for unsupported WebGL.** The original
   GPU test skipped whenever the app selected Canvas 2D. A shader regression
   therefore bypassed the assertion. Capability is now probed independently,
   and an available context requires the app to select WebGL2. As a negative
   control, invalid GLSL was temporarily injected in the isolated checkout:
   the GPU test failed at the WebGL canvas assertion instead of skipping. The
   production shader was restored afterward.
2. **P2: Reduced-motion clear check could pass on an automatically discarded
   framebuffer.** The test read pixels after presentation, when a WebGL buffer
   without `preserveDrawingBuffer` can already be empty. It now observes the
   explicit clear synchronously, verifies animation resumes when enabled, and
   verifies draw calls stop again when reduced motion is restored.

A further regression test covers a scroll-resume timer firing after a page
becomes hidden, followed by resuming on visibility restoration. The five
renderer/lifecycle tests pass both in Linux test-only software WebGL mode and in
Windows Chrome with hardware WebGL. Linux production build/static export,
ESLint, and TypeScript checks pass.

No additional actionable production-code defect was found in shader transforms,
gradient interpolation/blending, instance-buffer bounds, resize handling,
context-loss fallback, or effect cleanup. This is a scoped code review, not a
claim of exhaustive driver/browser coverage. Linux software rendering verifies
correctness only; it provides no hardware performance or battery evidence.

## Reproduction

On Linux:

```sh
npm ci
npx playwright install chromium
npm run test:visual -- --update-snapshots=none
PLAYWRIGHT_ALLOW_SOFTWARE_WEBGL=1 npm run test:visual -- --update-snapshots=none
PLAYWRIGHT_ALLOW_SOFTWARE_WEBGL=1 npx playwright test tests/beams.spec.ts
```

The fixture overrides `failIfMajorPerformanceCaveat` only inside the test browser;
production still rejects contexts with a major performance caveat. In software
mode each visual test asserts that the WebGL2 canvas is active before comparing.

To reproduce the data-drift diagnosis, use a disposable checkout, replace
`data/discogs-collection.json` with `git show 8d1f6c3:data/discogs-collection.json`,
run the WebGL visual suite, then restore that file from HEAD. Do not replace the
committed Linux snapshots with new current-data images as part of this PR.
