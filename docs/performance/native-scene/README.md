# Native scene regions and animation audit

The published 1905 CSS-pixel reference composition is preserved. Decorations now live in HTML slots inside the sky, sea, sidebar, sidebar extras, main panel, introduction, navigation cards, research list, and footer. CSS percentages and container-relative widths perform the layout before hydration. Only the editor measures DOM rectangles. Missing home sections on inner routes have proportional reference slots behind the main panel; sidebar foreground decorations remain above it.

New assets start in the region selected by **새 에셋을 붙일 영역**, for both desktop and mobile. Existing curated mobile placements and legacy viewport placements remain supported. Editor options include native image size, integer scale (1–8), pixelated interpolation, and a small allowlist of functional image links. The published mailbox links to email and the jukebox links to records. LocalStorage remains device-local; exported JSON committed to GitHub publishes edits for everyone.

Photo thumbnails are normal links to originals. Unmodified primary clicks open the existing viewer; modifier/middle clicks retain browser behavior. A noscript index exposes every original, and a More photos control backs up automatic loading. Text links use blue/unvisited and purple/visited styling.

## Asset measurements

`asset-inventory.json` records all 71 placed files, with 49 animated files, their intrinsic/display dimensions, byte counts, frame delays, loop settings, and isolated Chrome traces. Original placed images total 699,824 bytes (639,413 animated). Each animated candidate was checked by decoding every RGBA frame; RGB values beneath fully transparent pixels are irrelevant. Timing, frame count, and looping must also match.

- Lossless animated WebP candidates often downloaded fewer bytes but needed more measured decode work. They were not adopted.
- The parallel GIF audit is in `../native-scene-gif/asset-inventory.json`. Nine verified GIF variants save 10,447 bytes in total. All original downloads and archive files remain intact.
- `data/scene-optimized.json` selects the variants. `tests/scene-assets.spec.ts` rechecks their bytes, pixels, timing, and loop configuration directly against the originals.
- Initial reduced motion uses the CSS fallback without requesting the 909,352-byte ThorVG WASM or beam textures. Switching motion back on initializes the engine; switching it off releases the canvas. The development-only `beamTime` fixture still renders a frozen GPU frame for consistent Linux screenshots.
- The frame loop and tab-resume path also release the GPU scene when the current motion preference changes before its event arrives. A Windows Chrome regression after viewport resize reproduced a retained canvas before this fix; the test now checks removal and successful reinitialization, rather than frame stoppage alone.

The per-file traces use Windows Chrome, 1905×1000 CSS pixels, DPR 1, and 90 requestAnimationFrame intervals per file in an otherwise empty page. Decode, Paint, and RasterTask durations are recorded separately. A zero means no such trace event was observed during that sample, not proof of zero lifetime cost. These short samples characterize candidates; they are not physical presentation timing, GPU execution timing, or a guaranteed performance gain. Raw browser/GPU metadata is in `environment.json`.

Reproduce the inventory and candidate experiments:

```powershell
node scripts/profile-scene-assets.mjs http://127.0.0.1:3100
node scripts/profile-scene-assets.mjs http://127.0.0.1:3100 --gif
```

Add `--inventory-only` to verify pixels/timing without browser traces. Exploratory WebP outputs are ignored by Git. Scripts do not overwrite archived originals or automatically change the published variant manifest.

## Verification boundaries

Windows Chrome verifies WebGPU and WebGL animation during scrolling, resize, GPU/WASM failure, tab visibility, motion preference changes, FHD geometry, mobile overlap, native links without JavaScript, editor persistence, layer hit testing, and vinyl previews. Linux screenshots freeze animations/content and cover five routes at three viewport widths. Intentional link colors and the More photos control are reviewed before updating Linux baselines; Windows captures never replace them.

The production scroll profile uses `scripts/profile-retro.mjs` with `PROFILE_DPR=1`, 1920×1080 CSS pixels, and three trials each on home and vinyl. It records browser rAF cadence and main-thread work, not physical display presentation. Scrolling never pauses the beam animation.

Measured on Windows Chrome 153.0.8010.48: all six trials had p95 16.8 ms, no sampled intervals above 25 ms, and no observed long tasks. Each 240-frame scrolling trial advanced the WebGPU beam renderer by 240 frames at quality 0 / 60 fps. Home main-thread task time was 107–115 ms per trial; vinyl was 187–198 ms. This is a result on the recorded machine, not a guarantee for other devices. Raw results are in `scroll-production-dpr1.json`.

Final validation: lint and production export passed. Linux full suite: 45 passed, 1 skipped (no WebGPU adapter), including all 15 visual comparisons. Windows Chrome production export: 12 beam/native-scene tests passed, including both GPU backends; the additional native-link, keyboard, overflow, and GIF checks passed. FHD original coordinates, viewport reflow, mobile separation, and sidebar foreground retention are covered by the regression suite.
