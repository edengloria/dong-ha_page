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
