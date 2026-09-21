# Retro personal room and continuous ThorVG beams

## Result

The public site uses paper frames, a personal directory, three equal homepage
entrances, a publication archive, photo prints and record sleeves. Existing routes,
profile/publication facts, external links, CV, collection data and admin functions
are retained. Photo shuffle now happens after hydration; keyboard viewers restore
focus. Mobile record previews can be toggled off and on again.

ThorVG WebCanvas **1.1.2** renders cached PNG light textures on one canvas using
WebGPU, with WebGL initialization fallback. The package and WASM are pinned; the
909,352-byte WASM and its license are copied into the static export. Texture and
thumbnail generation is deterministic and runs before dev/build. No runtime CDN,
full-screen blur, backdrop filter, cursor tilt or scroll pause remains. The old
standalone `profile-beams.ts` benchmark is historical and does not measure this renderer.

The buffer is at most 1280 × 720 pixels and never exceeds CSS DPR 1. Quality levels
use 18/14/10 lights and scales 1/.75/.5. Sustained slow frames reduce quality before
limiting background drawing to 30 fps. Motion uses elapsed time. Hidden tabs and
reduced-motion preferences suspend animation; unavailable engines retain the CSS
background. PNGs are loaded once, not rebuilt on each frame.

## Validation

- `npm run lint`, `npx tsc --noEmit`, `npm run build`: passed.
- Windows Chrome 153.0.8010.48 against the production export: **13/13** behavior
  tests passed (WebGPU, WebGL, initialization failure, WASM failure, context loss,
  resize, continuous scrolling, visibility, reduced motion, mobile overflow,
  keyboard photos, real-media preview controls and obsolete-request cancellation).
- Renderer pixel checks hide the CSS fallback first, so a transparent/blank GPU
  canvas cannot pass by showing the fallback. Both GPU backends passed this check.
- Real Apple preview, without mocked search or media: audible volume **0.5**,
  playback time **> 0.3 s**, and pause on pointer leave. See `smoke-local.json`.
- All six routes including `/gallery/admin/` returned HTTP 200, without page errors.
- Linux Chromium 134 / Ubuntu 24.04: **15 visual cases** across five routes and
  mobile/tablet/desktop. This is an intentional redesign, so legacy snapshots were
  reviewed and replaced, then compared in a separate verification run. Background
  time is fixed at 8 s using a development-only hook; WebGL is selected explicitly.
  The checked-in 57-record data is unchanged. Shuffled photo images are masked,
  with an additional unmasked production screenshot reviewed manually.
- Linux screenshot environment uses Noto Sans CJK Regular (Ubuntu package
  `fonts-noto-cjk` 1:20230817+repack1-3) for Korean fallback. No webfont is shipped.
- Desktop and mobile home, publication archive, photo prints and record sleeves
  were inspected. CV/social links remain available on mobile.

## Performance evidence and limits

Sequential production measurements on the same Windows machine, Chrome 153,
1920 × 1080 viewport, DPR 2; three 240-frame scroll trials per route. Old production
was `https://dhsh.in` at `360ef99`; the replacement was the local static export.
Pages/assets were loaded before measuring. Hardware GPU compositing, WebGL and
WebGPU were enabled; device details are in the JSON evidence.

| Route | Before p95 | After p95 | Before median main-thread work | After median main-thread work |
| --- | --- | --- | --- | --- |
| Home | 16.8 ms | 16.8 ms | 62.4 ms / ~4 s | 95.1 ms / ~4 s |
| Vinyl | 16.8 ms | 16.8 ms | 99.5 ms / ~4 s | 170.7 ms / ~4 s |

All final trials: **0 intervals >25 ms**, **0 long tasks**, WebGPU quality level 0,
60 fps target, and **240 additional beam draws during each scroll trial**. The old
version paused its beams during scrolling; it did less CPU work. Therefore this
is evidence that continuous motion meets the target on this machine, **not** a
claim that ThorVG consumes less CPU or guarantees 60 fps on every device. The
legacy `beamFrames: 0` field is a missing diagnostic, not an instrumented draw count.

Chrome trace Paint events occurred during initial vinyl scrolling (26 new vs 150
old); subsequent trials reported zero Paint events. These events exclude GPU work
and are not a GPU-time measurement. rAF cadence is not physical presentation FPS
or input latency. Native hardware performance was not inferred from Linux software
WebGL screenshot runs.

Evidence: `production-before.json`, `production-after.json`. Earlier development
measurements `before.json` and `thorvg-before-redesign.json` validate the background
replacement before the design was applied; they are separate from the production
comparison above.

## Reproduce

```sh
npm ci
npm run lint
npm run build
npm exec --yes --package serve -- serve out -l 3102
# In a second shell (PowerShell: set these variables through $env:...):
PLAYWRIGHT_CHANNEL=chrome PLAYWRIGHT_BASE_URL=http://127.0.0.1:3102 npx playwright test tests/beams.spec.ts tests/scroll-effects.spec.ts tests/vinyl-preview.spec.ts
node scripts/profile-retro.mjs http://127.0.0.1:3102
node scripts/smoke-retro.mjs http://127.0.0.1:3102
```

Linux visuals require a dev server for the fixed-time hook. Use an explicit URL to
avoid accidentally reusing a different Windows/WSL server on a mirrored port:

```sh
npm run dev -- --hostname 127.0.0.1 --port 3101
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 PLAYWRIGHT_ALLOW_SOFTWARE_WEBGL=1 npx playwright test tests/visual.spec.ts
```

## Review and rollout

Review covered initialization fallback, global engine lifecycle, cleanup on context
loss, pixel-backed rendering assertions, static export assets, preserved links and
audio cancellation, mobile controls, hydration, keyboard focus and screenshot
determinism. Context-loss texture cleanup and photo hydration issues found during
review were fixed and retested. No remaining blocking findings were identified.

Merge to main triggers the existing GitHub Pages deployment. After it succeeds,
run the smoke check against `https://dhsh.in` to verify WASM/assets, all routes and
real audio on the public deployment. A rollback is a revert of this PR followed
by the same Pages workflow; no content data migration is involved.
