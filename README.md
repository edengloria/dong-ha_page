# Dong-Ha Shin Website

Static personal website for [https://dhsh.in/](https://dhsh.in/), refactored to keep the existing visual identity while making the codebase easier to extend.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion (vinyl interactions only)
- GitHub Pages static export

## Project Structure

```text
app/
  api/save-preferences/route.ts
  gallery/
    admin/page.tsx
    layout.tsx
    page.tsx
    photos/page.tsx
    vinyl/page.tsx
  globals.css
  layout.tsx
  page.tsx
  publications/page.tsx
components/
  content/rich-text.tsx
  gallery/
    gallery-tabs.tsx
    lp-collection.tsx
    photo-gallery.tsx
  home/
    about-portrait.tsx
    about-section.tsx
    publications-section.tsx
  layout/
    site-container.tsx
    site-footer.tsx
    site-navbar.tsx
    site-shell.tsx
    site-sidebar.tsx
content/
  profile.ts
  projects.ts
  publications.ts
  site.ts
  types.ts
data/
  discogs-collection.json
  track-preferences.json
lib/
  discogs.ts
  gallery.ts
  metadata.ts
  music-preview.ts
  utils.ts
public/
  CNAME
  robots.txt
  sitemap.xml
```

## Content Model

- `content/profile.ts`: biography, contact info, links, portrait
- `content/publications.ts`: publication cards and external links
- `content/projects.ts`: reserved for future project detail routes
- `content/site.ts`: navigation and site-wide SEO/deployment settings
- `data/*.json`: generated or workflow-managed datasets

## Setup

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run fetch-discogs
npm run optimize-images -- --replace
```

## Background graphics profiling

The beam background uses a dependency-free WebGL2 instanced renderer: all beams
share one draw call and a reusable instance buffer. The seven gradient stops,
source-over blending, movement, density, CSS blur, and DPR cap are preserved.
Canvas 2D remains the fallback when accelerated WebGL2 is unavailable, shader
setup fails, or the context is lost. Separate canvases allow fallback after a
WebGL context has already been acquired. Hidden tabs, scrolling, and reduced
motion suspend animation; resuming resets the elapsed-time baseline.

WebGL2 provides the instancing needed here without a WebGPU backend or another
graphics dependency. A software WebGL implementation is deliberately rejected.

Run `npx playwright test tests/beams.spec.ts` for renderer/lifecycle checks and
`npx tsx scripts/profile-beams.ts` for a deterministic 44-beam comparison at
1280 x 720. Set `PLAYWRIGHT_CHANNEL=chrome` to use installed Chrome if the bundled
headless browser lacks hardware acceleration. GPU-specific tests explicitly skip
without acceleration; the profile command fails rather than timing a fallback.
The profile writes images and JSON under `test-results/beam-profile/`.

On Windows Chrome with AMD Radeon integrated graphics, one local run measured
average CPU draw-submission time of 0.232 ms for Canvas 2D and 0.009 ms for WebGL2
(120 samples after 30 warmup frames). Mean absolute premultiplied channel error
before blur was 0.70 on a 0–255 scale. These are isolated renderer measurements,
not end-to-end FPS, GPU execution time, power consumption, or mobile results.
Linux screenshot validation found the same six gallery/data mismatches on base
and PR; using the snapshot-era Discogs input in an isolated checkout passed all
15 comparisons with WebGL2 active. Baselines and current data are unchanged.
See the [review and reproduction details](docs/graphics-performance/review.md).
For Linux shader correctness testing without hardware acceleration, use
`PLAYWRIGHT_ALLOW_SOFTWARE_WEBGL=1 npm run test:visual -- --update-snapshots=none`.
This test-only mode is not suitable for hardware-performance measurements.
See [recorded metrics](docs/graphics-performance/metrics.json) and current
[desktop](docs/graphics-performance/home-desktop.png) /
[mobile](docs/graphics-performance/home-mobile.png) captures.

## Deployment

The site is configured for GitHub Pages static export.

1. Push to `main`.
2. GitHub Actions builds the static export into `out/`.
3. The Pages workflow deploys `out/`.
4. `public/CNAME` preserves the custom domain.

If you need a repository subpath deployment instead of a custom domain, set `NEXT_PUBLIC_BASE_PATH` before building.

## Migration Notes

### Before

- Page components owned both content and presentation.
- Shared shell markup lived directly in `app/layout.tsx`.
- Publication/profile copy was duplicated across multiple files.
- Vinyl preview matching logic was duplicated between the gallery and admin route.
- SEO and Pages config were mixed with generated `v0` scaffolding.

### After

- Layout is composed from `SiteShell`, `SiteSidebar`, `SiteNavbar`, and `SiteFooter`.
- Public copy lives in `content/`, and UI components render typed data.
- Gallery/photo/vinyl pages stay route-level thin and import focused components.
- Shared Discogs and preview-search logic lives in `lib/`.
- Metadata, robots, sitemap, and GitHub Pages config are explicit and predictable.

## Extending the Site

### Add or edit biography

Update `content/profile.ts`.

### Add a publication

Append a new object in `content/publications.ts`.

### Add a future project page

Add a new item to `content/projects.ts`, then wire a route such as `app/projects/[slug]/page.tsx`.

### Update vinyl data

Use:

```bash
npm run fetch-discogs
```

The admin route helps curate track previews, while `data/track-preferences.json` remains version-controlled.
