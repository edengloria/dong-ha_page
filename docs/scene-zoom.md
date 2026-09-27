# Scene placement and browser zoom

The published FHD composition is the reference. Browser zoom must still enlarge
text normally; the artwork should follow its local panel instead of stretching
with the panel's content height or spreading across a wider sidebar.

## What Cameron's World actually does

Inspected on 2026-09-27: [HTML](https://www.cameronsworld.net/),
[stylesheet](https://www.cameronsworld.net/styles/main-ce8f24db13.css), and
[application script](https://www.cameronsworld.net/scripts/bundle-2fd99ed381.js).

The reference combines absolutely positioned sections, pixel-sized graphics,
percentage horizontal positions, and centred local containers/lockups. For
example, the two figures in section 10 share the horizontal centre with opposite
170px offsets. Section 11 uses a centred container capped at 1800px. Narrow-screen
media queries reposition or hide selected graphics. The sea textures repeat
across their sections. It is not one canvas uniformly scaled to the browser,
and it does not preserve every sprite's screen position at every zoom level.

## Adaptation to this site

- Published desktop placements now use an explicit group coordinate space.
  Their stored numbers, sizes, foreground choices and FHD composition are retained.
- The group's centre follows its section; its pixel spacing does not expand
  when the container gets wider or taller. Sky/sea keep their authored pixel
  sizes, with outlying artwork cropped by the existing viewport.
- A panel group scales its offsets and responsive sprite sizes together only
  when the panel is narrower than the saved reference. Ornaments attached to
  its top edge stay attached as text wraps and panels stack.
- Interior sidebar graphics use the shorter sidebar height in the compact
  layout. Top-edge ornaments are independent of that height.
- The existing 9-sprite mobile composition remains unchanged at 560 CSS px and
  below. Browser zoom naturally reaches this breakpoint.
- Geometry is CSS-driven in public HTML, including with JavaScript disabled.
  The editor and optional saved-layout loader use the same coordinate rules.
  No resize/scroll measurement loop or inverse-zoom transform is added.
- Unchanged saved placements migrate; custom edited placements retain their
  old coordinates. In the editor, “묶음 기준 배치” converts either way without
  jumping and is included in JSON exports.

This adopts the reference's local coordinate and pixel-art approach, while
retaining readable responsive content rather than copying its individual
breakpoints. Background edge cropping at high zoom is intentional.

## Verification

Run a built static site, then:

    npm run test:zoom

The script uses an isolated Chrome profile and the actual Page zoom selector in
Chrome Settings. It asserts the resulting DPR and an unchanged pinch scale.
It does not substitute CSS zoom, viewport emulation or deviceScaleFactor for
page zoom. Screenshots capture the compositor directly because a full-page
Playwright capture temporarily changes the viewport.

Windows Chrome 153.0.8010.48: 108 combinations passed (1920, 1366 and 2560px
outer windows; 75, 100, 125, 150, 175, 200, 250, 300 and 400%; home, research,
photos and records). Maximum panel-top attachment error: 0.0125 CSS px.
Checks also cover horizontal overflow, sidebar foreground preservation and
main decoration placement behind inner-page panels.

The numerical result is in [scene-zoom-results.json](scene-zoom-results.json).
It establishes layout alignment, not a GPU frame-rate measurement.

The Linux screenshot comparison initially retained all five mobile baselines.
Ten desktop/tablet baselines changed in the background/group decorations; their
diffs were reviewed before replacement. Content layout, text, photographs and
album grids retain their prior composition.

Regression tests cover FHD coordinates against the original layout export,
JavaScript-disabled rendering, narrower/wider groups, content growth, panel
edges, editor conversion/drag/save, old saved layouts, mobile overlap, native
navigation, photos, vinyl previews, and continuous WebGPU/WebGL animation.

Validation: Windows Chrome functional tests 40/40; Linux layout/editor/mobile
and visual tests 36/36 (including all 15 screenshots); lint and static build.
The explicit region-coordinate choice is persisted so migration cannot undo
the editor's group-mode opt-out.
