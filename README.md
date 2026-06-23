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
