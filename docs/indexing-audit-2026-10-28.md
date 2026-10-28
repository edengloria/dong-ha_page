# Search indexing audit — 2026-10-28

Audited source: `671faf8c86c7843ca0caef78c8538a94d7551d95` (main).
The October 26 Pages deployment for that commit succeeded:
<https://github.com/edengloria/dong-ha_page/actions/runs/40268333238>.
The October 26 Search Console email names two exclusion categories, but contains
no affected URLs. The Search Console browser connection timed out, so the report's
examples, last crawl dates and Google-selected canonicals remain unverified.

## Live site observations, before this change

Requests used GET without following redirects. All 71 URLs from the deployed
`https://dhsh.in/sitemap.xml` returned 200, had exactly one self-referencing
canonical, and had neither a noindex meta tag nor a meta refresh. An additional
91 distinct same-origin anchor destinations (photos, a PDF and the RSS feed)
returned 200. This is a current reachability check, not proof of Google indexing
or evidence of what Google received at its earlier crawl.

| Requested URL/path | HTTP result | Classification |
| --- | --- | --- |
| All 71 deployed sitemap URLs | 200, self-canonical | No current broken sitemap target found |
| `/publications`, `/gallery`, `/gallery/photos`, `/gallery/vinyl` | 301 to the same path with `/` | Keep directory URL normalization |
| `http://dhsh.in/` | 301 to `https://dhsh.in/` | Keep HTTPS normalization; outside the HTTPS URL-prefix property's source scope |
| `https://www.dhsh.in/` | 301 to `https://dhsh.in/` | Keep preferred-host normalization; outside that URL-prefix property's source scope |
| `https://edengloria.github.io/dong-ha_page/` | 301 to `https://dhsh.in/` | Keep custom-domain redirect; outside that property's source scope |
| `/seo-audit-nonexistent-20261028/` | 404, custom document, noindex | Correct missing-route behavior |
| `/404.html` | 200, noindex | Direct access to the host's error-template file; excluded from sitemap |
| `/projects/coming-soon/` | **200**, 404 message, noindex | Draft is excluded, but the status is incorrect for a not-found route |
| `/scene-editor/`, `/gallery/admin/` | 200, noindex, also robots-disallowed | Conflicting indexing controls |
| `/blog/search/`, `/blog/search/ko/` | 200, noindex | Intentional utility-page exclusion |

The observed redirects are examples of valid behavior, not a claim that these
are the URLs in the email. In particular, the property's URL prefix matters.

## Source findings and fixes

- `astro.config.mjs` uses `output: "static"`, directory output, `site:
  "https://dhsh.in"` and `trailingSlash: "always"`. Public pages do not configure
  application redirects. The `/studio/` redirect under `publishing/` belongs to
  the separate authoring deployment, not dhsh.in's static site.
- `lib/metadata.ts` normalizes public canonicals to a trailing slash and applies
  the deployment base. `src/layouts/BlogDocument.astro` uses the slash-terminated
  blog paths from the publishing helpers. The live sitemap canonicals agree with
  the delivered URLs. No canonical rewrite was needed.
- `scripts/publishing-output.mjs` scans generated HTML and overwrites the fallback
  robots and sitemap files in `public/`. It excludes noindex pages and the error
  template, and includes pagination, record details and published CMS articles.
  The public fallback sitemap alone is not the deployed sitemap.
- **Fix:** `src/pages/projects/[slug].astro` previously generated files even for
  draft projects, so Pages served a 404-looking document with status 200. Generate
  published projects only. Missing drafts then use the existing noindex
  `404.html` and HTTP 404. The public project list already filters drafts. Keep
  the existing missing-page design; do not redirect drafts to the homepage.
- **Fix:** remove editor/admin Disallow rules from generated robots.txt so Google
  can fetch their existing noindex metadata. Keep their noindex, sitemap/search
  exclusion and existing application behavior. Crawling permission is not
  authentication, and this change grants no new application access.
- `scripts/serve-documents.mjs` now models the production custom-404 response,
  making status and error-page tests meaningful locally.

Neither fix has been established as the cause of the email's two categories.
A 200 error document can instead be classified as soft 404 or excluded by
noindex; a robots/noindex conflict is a separate indexing-control issue.

`/gallery/` and `/gallery/vinyl/` both render the record collection with distinct
self-canonicals. This is an existing duplication consideration, not a demonstrated
404 or redirect failure; their intended navigation is preserved.

Record routes use collection `instance_id`, photo pages start at page 2 after
the main gallery, and article routes use published language/slug pairs. Removed
records, reduced photo-page counts, renamed articles and old taxonomy URLs can
leave old URLs missing. Only the Search Console examples can establish whether
any such URL is involved and whether a relevant replacement exists.

## Validation

- Production build succeeded before and after the change, using published CMS
  content. The resulting 71-URL sitemap and `404.html` were byte-identical.
- Draft output `out/projects/coming-soon/index.html` is absent after the fix;
  generated robots.txt allows the crawl and retains the sitemap declaration.
- Post-build link audit: 164 distinct internal paths referenced by indexable
  documents resolved to existing output files, with no broken targets.
- `npm run lint`: passed (0 errors, 0 warnings; 3 existing deprecation hints).
- `npm run test:server`: 1 passed.
- `node --import tsx --test scripts/tests/publishing.test.ts scripts/tests/comments.test.ts`:
  20 passed. Used the Node import form because the tsx CLI's IPC pipe is blocked
  in this environment; repository test files were unchanged.
- `PLAYWRIGHT_ALLOW_SOFTWARE_WEBGL=1 npm run test:visual -- tests/indexing.spec.ts tests/astro.spec.ts tests/publishing.spec.ts tests/analytics.spec.ts --reporter=line`:
  16 passed, including new sitemap/status/exclusion checks, custom 404 rendering,
  admin hydration, static search, publishing and analytics exclusion behavior.
  The full screenshot suite was not run and no screenshot baselines were changed.

## Search Console follow-up

For the `https://dhsh.in/` property, export the example URLs under both **Not found
(404)** and **Page with redirect**, with each URL's last crawl date. Preserve the
exact URL, including trailing slash and query. Compare all-known URLs with the
submitted-sitemap subset and check the submitted sitemap's last read/status.

For an intended public page, use URL Inspection to compare the last crawl result,
live fetch, referring page/sitemap, declared canonical and Google-selected
canonical. Inspect redirect destinations separately. Repair live broken links
or restore intended routes; add a specific redirect only when a real replacement
is known. Keep valid redirects and intentional missing/draft pages. After the
change is merged and deployed, verify draft HTTP status and robots.txt again
before requesting validation/indexing for affected public destinations.

References:
- [Google: Page indexing report](https://support.google.com/webmasters/answer/7440203?hl=en)
- [Google: noindex requires crawl access](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Google: HTTP status handling](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes)
