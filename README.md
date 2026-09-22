# Dong-Ha Shin Website

Static personal website for [https://dhsh.in/](https://dhsh.in/), refactored to keep the existing visual identity while making the codebase easier to extend.

## Stack

- Next.js App Router as build-time templates and a separate scene editor/admin app
- TypeScript
- Tailwind CSS
- Plain HTML public documents with small native DOM enhancements
- ThorVG WebGPU / WebGL background
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
node scripts/serve-documents.mjs
npm run lint
npm run fetch-discogs
npm run optimize-images -- --replace
```

## Background graphics profiling

ThorVG renders precomputed beam textures on one canvas, trying WebGPU before
WebGL. Rendering is capped at DPR 1 and 921,600 pixels; sustained load first
reduces resolution/beam count, then background cadence. Scrolling never pauses
animation. Hidden tabs pause scheduling, and reduced motion releases the GPU
scene. Loading or GPU failure leaves the same-colored CSS background.

`lib/native/beams.ts` is shared by the public document and editor preview.
Run `npx playwright test tests/beams.spec.ts` for lifecycle checks. Use
`PLAYWRIGHT_CHANNEL=chrome` for Windows hardware GPU validation. Run
`PROFILE_DPR=1 node scripts/profile-retro.mjs http://127.0.0.1:3100` against a
production export for browser rAF/main-thread measurements; these are not
physical display or GPU execution timings.

The default Playwright server builds a test-only export with frozen beam time.
Linux visual comparisons use `PLAYWRIGHT_ALLOW_SOFTWARE_WEBGL=1 npm run test:visual`.
This software path is not a performance measurement. A manually provided
`PLAYWRIGHT_BASE_URL` must serve a `DOCUMENT_VISUAL_TEST=1` build for screenshots.
The Pages workflow rejects that fixture flag. Windows screenshots must never
replace Linux baselines.

## Public documents

`npm run build` exports Next's fully rendered HTML, then runs
`scripts/build-documents.mjs`. Public pages lose the framework bootstrap, Flight
payload, and script preloads. They use copied CSS and a small esbuild module
entry, with separate lazy modules for photos, previews, saved scene edits, and
ThorVG. The build rejects React/Next dependencies in these public modules.
`out/document-build.json` records the emitted documents and script sizes.

The two-panel shell is a presentation table which stacks on narrow screens.
Links load ordinary HTML documents. All 89 photographs are reachable through
numbered index pages; originals work without JavaScript. Every record has a
track-list document. Optional native scripts add a keyboard photo dialog and
hover/Play/Retry audio. The editor and admin routes retain React, and links
leaving them also perform full document navigation.

Published placements remain in `data/scene-layout.json`. Only browsers with a
saved local scene load its migration/rendering module. LocalStorage previews
are still device-local; commit the exported JSON to publish for everyone.
Panel-edge coordinates, sidebar foreground layering, and the mobile scene are
preserved. See [implementation and validation](docs/document-web/README.md).

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
