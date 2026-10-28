# Visitor analytics

The public Astro site uses Umami Cloud for anonymous pageviews and outbound-link
events. Google Search Console reports Google search queries, impressions and
clicks for the `https://dhsh.in/` URL-prefix property.

## Deployment

GitHub repository variables, passed to every source and CMS-triggered Pages build:

| Variable | Purpose |
| --- | --- |
| `PUBLIC_ENABLE_ANALYTICS` | Set to `true` to enable Umami; disable and rebuild to stop collection. |
| `PUBLIC_UMAMI_WEBSITE_ID` | Public website ID from Umami's tracking-code dialog. |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | Public Search Console verification token, rendered on the homepage. |

These values are public identifiers, not API keys. No Umami API token or Google
credential belongs in source or browser code. Keep the Google verification tag
after verifying ownership. Submit `https://dhsh.in/sitemap.xml` in Search Console;
the existing build adds published articles and removes unpublished ones.

## Indexing and intentional exclusions

`scripts/publishing-output.mjs` regenerates `out/sitemap.xml` and `out/robots.txt`
after Astro builds. The files in `public/` are fallbacks, not the final deployed
URL list. The sitemap is collected from generated public HTML with a canonical
URL and main content; noindex documents, the custom 404, editor and admin are
excluded. It includes photo pagination, record details and published blog posts.

Public document canonicals and internal navigation use a trailing slash, matching
Astro's directory output. GitHub Pages redirects slashless directory URLs to the
slash URL. A Search Console "Page with redirect" entry for such a source URL is
expected when the final destination is the intended, indexable page.

Draft project routes are not generated. GitHub Pages serves the existing
`404.html` with HTTP 404 and noindex for those paths, as it does for other missing
URLs. A document that merely displays "404" while returning HTTP 200 is not a
real not-found response. Do not redirect every missing URL to the homepage.

The editor, record administration and blog search pages retain noindex. Allow
crawling so Google can read that directive; robots.txt blocking does not enforce
noindex. They remain absent from the sitemap and Pagefind. This is an indexing
policy, not authentication; the existing admin convenience gate is unchanged.

For a Search Console alert, export the example URLs separately for "Not found
(404)" and "Page with redirect". Preserve scheme, hostname, case, query and
trailing slash, and record the last crawl date. Check both all-known URLs and
submitted-sitemap URLs. For each URL, compare the first HTTP response, redirect
destination, final response, declared canonical and Google's selected canonical.
Fix a 404 if an intended public page or a current internal/sitemap link requires
it; retain intentional removals and missing/draft URLs. Keep legitimate redirects
and inspect the destination's indexing status. An email's date is not proof that
the latest deployment caused an exclusion. Recheck after deployment before
requesting validation or indexing of affected public destinations.

`tests/indexing.spec.ts` verifies the generated sitemap against HTTP responses,
canonical metadata and exclusion rules, and checks real custom-404 responses.

## Collected data

- Umami's standard pageview metrics: public page path/title, browser language,
  screen dimensions, source site, device/browser and approximate country.
- `outbound-link`: `kind` (`github`, `scholar`, `paper`, `external`) and destination
  origin/path. The current public page is included automatically. Local PDF
  clicks also count; ordinary internal links are covered by pageviews.
- URL queries and fragments are removed. External referrers retain only their
  origin; internal referrers retain origin/path. Forms and editable content are
  excluded. No names, emails, passwords, comment text or user IDs are sent.
- No session replay, heatmaps, fingerprinting code, identity calls or input
  recording is added by this site. Umami's cookie-free anonymous session
  estimates are not an exact count of distinct people.

Only `https://dhsh.in` runs the loader. Development, visual fixtures, noindex
pages, the editor, admin pages and Studio/draft previews are excluded. Do Not
Track, Global Privacy Control and Umami's browser opt-out are respected. An ad
blocker or service outage can reduce reported counts without breaking the site.

To exclude your own browser, run this once in the developer console on dhsh.in:

```js
localStorage.setItem('umami.disabled', '1')
```

Remove that key to count visits again. This preference is local to that browser.

## Verification and ownership

`tests/analytics.spec.ts` intercepts the third-party script so automated tests
never write production analytics. It checks page/link payloads, sensitive URL
removal, form exclusion, non-public hosts, privacy signals and service failure.
After deployment, verify one real pageview and outbound-link event in Umami,
then verify Search Console ownership and sitemap submission. Search reports
take time to populate; successful verification is not evidence of search traffic.

Use the private Umami dashboard; do not enable a public share link. Export
reports periodically for your own records. The site needs only a tracker URL
and website ID, so switching to a self-hosted Umami instance later does not
affect article URLs, Sanity content or the static publishing workflow.

References: [Umami configuration](https://docs.umami.is/docs/tracker-configuration),
[Umami events](https://docs.umami.is/docs/track-events),
[Search Console verification](https://support.google.com/webmasters/answer/9008080).
