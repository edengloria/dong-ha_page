# Sunset, ocean and original introduction

## Changes

The header uses original Cameron’s World sunset, birds, palms, dolphins, fish,
coral and water files, hosted locally. The manifest in
`public/asset/camerons-world/manifest.json` records the source and SHA-256 of every
file. The total image payload, including reduced-motion alternatives, is 180,390
bytes. The footer credits Cameron’s World and its GeoCities archives.

The 150×150 animated water texture repeats in a 96px-high surface band, fading
into a static underwater texture. The existing single ThorVG canvas is transparent
over those textures; its blue/indigo/purple light shines through the water. The
opaque sunset stays above the canvas. Scrolling does not stop beam animation.
GIF sprites select their original PNG counterparts for reduced motion; the water
uses an extracted first frame. No new rendering dependency or remote runtime
request was introduced.

The marketing headline, taglines and welcome copy are removed. The homepage
begins with the original affiliation paragraph and research-interest sentence.
“More about me” opens a native modal containing all four original paragraphs and
links. Escape, close button, backdrop dismissal and focus return use native dialog
behavior. The three entrances contain only numbers and linked titles.

## Verification

- `npm run lint` and `npm run build`: pass.
- Windows Chrome production-export functional tests: 15 pass, including WebGPU,
  WebGL, initialization/context failures, resize, continuous scrolling, visibility,
  reduced motion, photo keyboard navigation, vinyl retry/cancellation/mobile play,
  original intro dialog and local sprite loading.
- Linux Chromium visual comparison: 15 pass at widths 390, 768 and 1440 across
  five routes. Intentional new screenshots reviewed and registered. The clock is
  fixed at `beamTime=8`; reduced motion selects still sprites/water; the photo
  shuffle seed and existing photo masks are retained.
- Desktop/mobile homepage and dialog screenshots accompany this document.

A first local build overlapped the development server's `.next` output and failed;
stopping the dev server and building separately resolved it. Production tests above
ran against the isolated static export. The first cold Linux renderer setup timed
out; the targeted rerun and subsequent full comparison passed.

## Scroll measurements

Windows Chrome 153.0.8010.48, 1920×1080 CSS pixels, DPR 2, same machine/browser,
WebGPU enabled. `scripts/profile-retro.mjs` measures 240 rAF-driven scroll frames
per trial, three trials per route. Baseline is the previous public release
`c53120e`; candidate is the local production export. Measurements start after
loading and settling. Raw browser/GPU/task/paint evidence is in the adjacent JSON.

| Route | Previous p95 | New p95 | Previous main-thread median / trial | New median |
| --- | ---: | ---: | ---: | ---: |
| Home | 16.8ms | 16.8ms | 104.9ms | 89.2ms |
| Vinyl | 16.8ms | 16.8ms | 187.6ms | 144.0ms |

All six candidate trials recorded zero intervals over 25ms, zero long tasks and
240 beam draws, retaining quality 0 / 60fps. The first vinyl trial recorded 63
paint events totaling 2.051ms; later trials recorded no new paint events.
These are browser scheduling/task measurements, **not physical display FPS or
GPU execution time**, and do not guarantee performance on every device. The
matching cadence supports no observed scroll regression from the added scenery;
the task-time difference alone does not establish a general speedup.
