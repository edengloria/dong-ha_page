# Repository Guidelines

## Project Structure & Module Organization
This is a **Next.js App Router** TypeScript site organized for content-first composition.

- `app/` contains routes and layouts, including route components and API handlers.
- `components/` holds reusable UI, grouped by area (`home`, `layout`, `gallery`, `content`).
- `content/` stores typed content models consumed by pages (profile, publications, projects, site settings).
- `lib/` contains shared data/utility logic (Discogs, metadata, preview helpers, utilities).
- `data/` stores generated or curated datasets and is updated via scripts.
- `public/` contains static assets and deployment files (`CNAME`, `robots.txt`, `sitemap.xml`).
- `scripts/` contains maintenance tasks (Discogs sync, image optimization, color sorting).

## Build, Test, and Development Commands
- `npm install` — install dependencies.
- `npm run dev` — start local development server.
- `npm run build` — production build.
- `npm run lint` — run ESLint with Next config.
- `npm run start` — run built app.
- `npm run fetch-discogs` — refresh Discogs dataset.
- `npm run optimize-images -- --replace` — optimize and replace images from local scripts.
- `npm run sort-by-color` — organize media assets by computed palette.
- `npm run profile:build` — alternate production build alias.

## Coding Style & Naming Conventions
- TypeScript strict mode is enabled (`tsconfig.json`), so prefer explicit types where behavior is unclear.
- Use 2-space indentation, semicolons, and existing component/style patterns in neighboring files.
- Keep component filenames in `kebab-case.tsx` for pages/layouts and `camelCase` or `PascalCase` as currently used in React components.
- Use `PascalCase` for React components and `camelCase` for variables/functions.
- Follow `next/core-web-vitals` lint expectations; address lint warnings instead of suppressing.

## Testing Guidelines
- The repository currently does not include a dedicated test suite directory or script.
- Use `npm run lint` and `npm run build` as the minimum verification path for every change.
- For behavior changes, validate manually in `npm run dev` before requesting review.
- If adding tests, use the same tech stack conventions as the repo and name files adjacent to the feature (`foo.test.ts` or `foo.test.tsx`).

## Commit & Pull Request Guidelines
- Recent history uses Conventional Commit style (`feat:`, `fix:`, `refactor:`, `chore:`). Match this style.
- Keep commit messages imperative and scoped (`feat(gallery): add new collection sorting` style is preferred).
- PRs should include: summary, changed files/areas, manual verification (`lint`, `build`), and screenshots for UI changes.
- Link issue/Task IDs when available and note any data updates (`data/*.json`) in the description.

## Security & Configuration Tips
- Keep API keys and secrets out of `scripts/` and `content/`.
- Use environment variables for deployment-sensitive values and avoid hardcoding domain/base path logic.
- For Pages deployment, confirm `public/CNAME` and export output expectations before merging.
