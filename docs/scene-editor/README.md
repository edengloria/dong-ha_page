# Asset archive and placement editor

Open `/scene-editor/` directly. Editor controls and its navigation link are hidden on ordinary public pages.

- Browse 2,594 entries by original section, filename or animated-only filter.
  This includes 1,992 unchanged original files and 602 extracted atlas rectangles.
  The original site's 56 broken image references are recorded in the catalog.
- Click a thumbnail to add it, then drag its outlined box. Arrow keys move 1px;
  Shift + arrow moves 10px. Numeric controls set horizontal percentage, page Y,
  width and rotation. Hide, remove, order and place above/below the content.
- Desktop and mobile (≤560px) store independent positions and sizes. Edit at the
  corresponding browser width; the toolbar identifies the layout being changed.
- Select an attachment region, then enable **윗변에 붙이기** for ornaments sitting
  on a panel border. Its Y value becomes the distance from the region's top to the
  image's bottom (FHD pixels): zero touches the border, positive overlaps the panel,
  negative leaves space above it. Toggling preserves the current image position;
  resizing the image keeps its bottom attached. The offset follows region width,
  never panel height. Original-size and integer-scale images use their actual height.
- The nine existing ornaments above the main/sidebar panels retain their original
  FHD composition. Unedited browser saves migrate to this attachment; manually
  moved assets and separate mobile coordinates remain intact. Stacked panels reserve
  space for main-panel ornaments, while sidebar foreground ordering survives navigation.
- Undo/redo retain 50 changes. Preview hides drag handles; collapsing the panel
  makes the actual composition visible without controls covering it.
- “브라우저에 저장” persists the scene on this browser and across public routes.
  It does not change what other visitors see. “브라우저 저장 지우기” returns to the
  published configuration.
- Export `scene-layout.json`, or import it to recover/transfer a layout. To publish,
  use the linked GitHub upload page to replace `data/scene-layout.json` and commit.
  The existing Pages workflow deploys it. No repository token is stored in-browser.

The default sun is now centered near the horizon, with a separate mobile size and
position. Default decoration coordinates are in `data/scene-layout.json` rather
than fixed CSS selectors. The existing ThorVG background continues while scrolling.

Archive originals, checksums, missing-source records and derived image provenance:
`public/asset/camerons-world/archive/catalog.json`. The full archive is also
available as `public/asset/camerons-world/archive.zip`.

## Validation

- Lint and static production build pass, including the new `/scene-editor/` route.
- 18 Windows Chrome production tests pass. Three editor tests cover dragging,
  undo/redo, keyboard movement, numeric typing, per-breakpoint persistence,
  navigation, catalog selection, layering, deletion, export/import and rejection
  of malformed data. The final numeric-input change was retested with all three
  editor tests. Existing beam, modal, photo and vinyl tests remain passing.
- 15 Linux screenshot comparisons pass after reviewing and updating the intended
  sun/decor positions and footer link. Reduced motion and fixed beam time preserve
  deterministic screenshots. Desktop/mobile editor/home images accompany this file.
- All 2,594 selectable files match their recorded SHA-256; all thumbnails/stills
  exist. The 27,906,666-byte ZIP has 5,807 entries and passes CRC verification.
- A placement at page Y=2,000 extends document scrolling to include the image;
  it is not constrained to the header. Horizontal clipping avoids page overflow.
- Public-page tests confirm the asset catalog is not requested on ordinary routes.

Storage and layout files are validated (version, finite coordinate ranges, bounded
item count, local image paths and unique IDs). The editor checks imported image
and still-frame paths against the catalog. It never accepts executable content or
remote image URLs. GitHub Pages remains static; browser saves are explicitly labeled
as local previews rather than public publishing.

Windows Chrome 153 at 1920×1080 / DPR 2: three 240-frame scroll trials each on
home and vinyl retained WebGPU quality 0 / 60fps, 240 beam draws per trial,
p95 intervals of 16.8ms and no long tasks. Median main-thread time per trial was
101.2ms on home and 181.3ms on vinyl. Raw results are in `performance-windows.json`.
These measure browser scheduling/task time, not physical display FPS or every
possible user-created arrangement. Hundreds of manually added animated GIFs have
not been performance-qualified.
