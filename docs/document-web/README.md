# Document-based personal website

The site's overall composition is retained: sunset/ocean scene, left directory,
main sheet, three home destinations, and the owner's attached GIFs. The public
experience now uses independent HTML documents instead of a hydrated React app.
Next/React remain build-time templates and the runtime for `/scene-editor/` and
`/gallery/admin/`. This is a modern-browser implementation of late-1990s document
conventions, not a claim of compatibility with Netscape or Internet Explorer 4.

## Changes

- Presentation table for the two-panel shell; mobile stacks the same cells.
  The original 1905 CSS-pixel reference boxes and all 71 desktop placements are
  unchanged within the existing rounding tolerance. No scene JSON was edited.
- Times headings, ordinary blue/visited-purple links, inset/outset borders,
  gray controls, and natural photo proportions replace tilted prints, flat
  application cards, modal album details, and infinite photo loading.
- 89 photos are reachable through four real index documents; 57 records each
  have a full track-list document. Photo links work without JS or in a new tab.
- Native DOM modules supply the photo dialog, single-owner audio preview, saved
  scene preview, and the unchanged ThorVG renderer. Hover cancellation, explicit
  Play/Retry, regional search fallback, mobile play/stop, and page-hide cleanup
  remain supported. Scrolling never pauses beams.
- The public entry is 3,929 bytes minified/uncompressed. Optional modules are
  photos 1,725 B, records 5,978 B, saved scene 21,250 B, and ThorVG JS 455,471 B;
  WASM is separate. These are emitted file sizes, not network transfer totals.
  Initial reduced motion loads neither ThorVG nor its WASM/textures.

`scripts/build-documents.mjs` removes framework scripts, Flight data, and JS
preloads from the fully rendered export, copies the stylesheet, and attaches the
native entry. It fails on incomplete markup or React/Next in the native bundle.
Known notFound exports receive the complete exported 404 document. Explicitly
enabled Google Analytics and JSON-LD remain supported. Private application pages
are excluded. All navigation, including links out of the editor, is ordinary
document navigation. Local scene migrations use the same sprite styles and
coordinate helpers as the editor, and custom edits survive.

## Validation

- Production builds and lint passed on Windows and Linux build/type checks.
- A separate `/subpath` production export passed Chrome smoke checks for active
  navigation, home foreground decorations, photo expansion, editor save/reload,
  and WebGPU resources with no failed local requests or page errors. Pathname
  normalization accepts both Next's stripped path and the browser's full path.
- Windows Chrome: all 37 functional tests passed; after the final collection
  grid adjustment, six photo/audio/overflow tests passed again.
  Six document/anchor/layering checks also passed after pathname normalization.
- Linux Chromium: 51 passed, one skipped because no WebGPU adapter was available.
  Windows separately passed both hardware WebGPU and WebGL paths.
- All 15 prior Linux screenshots were compared before updating. Differences
  were reviewed for typography, borders, links, and gallery presentation. The
  updated 15 comparisons passed in the full Linux run. Offscreen images are
  decoded before captures; photo masks from the original suite are retained.
- Tests cover no framework requests/RSC navigation, no-JS photo pagination and
  album details, saved/invalid/cleared scenes, editor persistence, mobile overlap,
  panel-edge geometry, sidebar foreground retention, photo keyboard/focus,
  audio cancellation/retry, both GPU paths, context loss, and motion preferences.

Screenshots: [home desktop](../../tests/visual.spec.ts-snapshots/home-desktop-linux.png),
[home mobile](../../tests/visual.spec.ts-snapshots/home-mobile-linux.png),
[photos](../../tests/visual.spec.ts-snapshots/gallery-photos-desktop-linux.png),
[records](../../tests/visual.spec.ts-snapshots/gallery-vinyl-desktop-linux.png).

## Scroll measurement

Sequential measurements used Windows Chrome at 1920×1080 CSS px, DPR 1,
three 240-frame scripted scroll trials each on home and records. The baseline
was the public site at main `56abb431ea5d4a41661a7d453acb41e705a19217`; the new
build was served locally. Network loading settled before sampling. Raw browser,
GPU, rAF, trace, and main-thread results are in [before](scroll-before.json) and
[after](scroll-after.json).

| Sample | Before | After |
| --- | --- | --- |
| Home rAF interval p95 | 16.8 ms | 16.8 ms |
| Records rAF interval p95 | 16.8 ms | 16.7–16.8 ms |
| Home main-thread task time per trial | 112.7–116.5 ms | 109.5–111.0 ms |
| Records main-thread task time per trial | 178.7–198.4 ms | 103.1–142.0 ms |

All trials advanced the WebGPU beam counter by 240, at quality 0 / 60 fps.
These short browser measurements are not physical display presentation, GPU
execution time, or a guarantee for other machines. Changing pagination/layout
also changes which images a scroll sample encounters. A zero Paint duration
means no such trace events were observed, not zero rendering cost.

## Reproduction

```sh
npm ci
npm run lint
npm run build
node scripts/serve-documents.mjs
# Separate shell, real hardware on Windows:
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 PLAYWRIGHT_CHANNEL=chrome npx playwright test --grep-invert '(home|publications|gallery|gallery-photos|gallery-vinyl) (mobile|tablet|desktop)$'
PROFILE_DPR=1 node scripts/profile-retro.mjs http://127.0.0.1:3100
```

For Linux screenshots, build with `DOCUMENT_VISUAL_TEST=1` or let the default
Playwright webServer build the fixture. Run the full suite with
`PLAYWRIGHT_ALLOW_SOFTWARE_WEBGL=1`. The fixture freezes `?beamTime=8` and is
rejected by the Pages deployment workflow. Production ignores that query.
