# Dong-Ha Shin Website

Static personal website for [dhsh.in](https://dhsh.in/).

## Stack and rendering

- Astro 7: file routes, metadata, HTML and static asset generation.
- TypeScript, React templates and Tailwind CSS.
- Public pages are complete HTML with small native DOM enhancements. They
  contain no hydrated React or Next runtime.
- Only `/scene-editor/` and `/gallery/admin/` hydrate React islands.
- ThorVG WebGPU / WebGL background; GitHub Pages deployment.

Astro renders the existing React presentation components at build time. The
two-panel layout, saved scene coordinates, mobile layout, content and URLs are
preserved. Links perform ordinary document navigation. Photo pagination and
record details work without JavaScript; native modules add photo expansion,
hover/Play/Retry audio, local scene previews and continuously moving beams.

## Setup

Use Node.js 24 LTS (minimum 22.12).

```sh
npm ci
npm run dev
npm run lint
npm run build
npm run start
```

`astro build` writes directly to `out/`. `scripts/document-audit.mjs` checks
the generated documents and the entire reachable public JavaScript graph,
including lazy imports, for framework leakage. It writes sizes and route
information to `out/document-build.json`. It does not rewrite HTML.

## Structure

- `src/pages/`: Astro routes and generated photo/record/project documents.
- `src/layouts/`: shared HTML head and public native script entry.
- `src/styles/global.css`: existing site and scene styling.
- `components/`: build-time presentation and editor/admin React islands.
- `content/`: biography, publications, projects, site metadata and links.
- `data/`: published scene, record collection and track preferences.
- `lib/native/`: framework-free background, photos, audio and saved scenes.
- `scripts/`: asset preparation, development persistence, auditing and maintenance.
- `public/`: images, archived assets, `CNAME`, robots and sitemap.

Edit `content/profile.ts` for the biography, `content/publications.ts` for
research, and `content/projects.ts` for projects. Published projects get their
own static route automatically; drafts display a noindex not-found document.

## Editor and record administration

Visitor statistics and Google search reporting are documented in the
[analytics guide](docs/analytics.md).

The [scene editor guide](docs/scene-editor.md) covers image uploads, editable
text and links, multiple selection, locking, resizing, appearance and portable
JSON. Browser saves remain device-local. Commit the exported JSON to
`data/scene-layout.json` to publish it. No editor controls appear on public pages.

`/gallery/admin/` keeps its existing client-side convenience password gate
(`PUBLIC_ADMIN_PASSWORD`); it is not server authentication. Track preference
writes use a local Vite middleware during `npm run dev` only. It validates
same-origin requests and serializes file writes to `data/track-preferences.json`.
Static production has no write endpoint. Commit local changes to publish them.

`npm run fetch-discogs`, `npm run optimize-images -- --replace` and
`npm run sort-by-color` remain available.

## Graphics and verification

ThorVG uses one canvas, tries WebGPU then WebGL, and caps rendering at DPR 1 /
921,600 pixels. Sustained load reduces resolution and beam count before frame
rate. Scrolling never pauses it. Hidden tabs and reduced motion stop scheduling;
GPU failure retains a readable static background. WASM is served locally.

```sh
npm run test:server
npm run test:visual
npm run test:zoom
```

The Playwright server builds a test-only fixture with frozen beam time.
Linux screenshots require `PLAYWRIGHT_ALLOW_SOFTWARE_WEBGL=1`. If providing
`PLAYWRIGHT_BASE_URL` yourself, serve a `DOCUMENT_VISUAL_TEST=1` build.
The Pages workflow rejects that flag. Do not replace Linux snapshots with
Windows screenshots. `PLAYWRIGHT_CHANNEL=chrome` selects installed Windows
Chrome for hardware GPU checks. `test:zoom` checks actual browser zoom.
Visual tests freeze `tests/visual-layout.fixture.json` (the composition used by
the existing baselines); geometry and functional tests also cover the current
published layout. Linux CI pins Ubuntu 24.04 and `tests/fontconfig.conf` to
match baseline font metrics. New owner uploads do not silently refresh snapshots.
The font profile reads DejaVu from `/usr/share/fonts/truetype/dejavu` and only
`NotoSansCJK-Regular.ttc` from `.visual-baseline/baseline-fonts/`; CI prepares
that folder. This excludes host-specific CJK serif/bold substitutions.
See [document behavior and earlier measurements](docs/document-web/README.md);
earlier timing measurements are not new Astro performance results.

## Deployment and environment

Push to `main`; GitHub Actions uses Node 24 to build and deploy `out/` to
Pages. `public/CNAME` retains the domain. Set `PUBLIC_BASE_PATH=/subpath`
before building for a subdirectory deployment. Local static test serving with
`scripts/serve-documents.mjs` accepts the same variable.

Optional analytics uses `PUBLIC_ENABLE_ANALYTICS=true` and
`PUBLIC_GA_MEASUREMENT_ID=G-...`. The workflow maps the existing repository
admin-password secret to `PUBLIC_ADMIN_PASSWORD`, so no secret rename is needed.
Never put Discogs API tokens in public environment variables; collection sync
uses `DISCOGS_TOKEN`.
