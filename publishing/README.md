# dhsh.in research publishing

The public website is a static Astro build on GitHub Pages. Sanity is the writing
backend. A separate authoring deployment at studio.dhsh.in serves Studio,
authenticated draft previews and the signed deployment webhook. Canonical article
URLs always belong to dhsh.in.

## Current rollout

Implemented: bilingual static articles, taxonomy and series, Portable Text figures,
math, code, tables, citations, galleries, paper cards, registered optical demos,
private preview, deployment status, sitemap/RSS/Pagefind and full content export.
The realistic Korean authoring proof is an unpublished draft in the real CMS.

**Production authoring hosting, DNS and the live webhook are not connected yet.**
Until verified, publishing saves to Content Lake without automatically deploying
dhsh.in. Do not describe that state as live.

## Local development

Use Node 24 and `npm ci` at the repository root. In separate terminals run
`npm run dev:studio`, `npm run dev:preview`, and `npm run dev`.

Studio runs at http://127.0.0.1:3333/; preview runs on port 4322. Open it through
Studio's **Preview** tab to authenticate the HttpOnly session with Sanity's
short-lived preview secret. Direct anonymous previews are rejected. The public
Astro application reads anonymous published content only.

Project `f0xserx3`, dataset `production` are public identifiers. Server credentials
belong only in ignored `publishing/.env.local` or the authoring host's environment:

| Variable | Purpose |
| --- | --- |
| SANITY_READ_TOKEN | Project Viewer robot token for draft preview |
| PREVIEW_SESSION_SECRET | At least 32 random characters for preview cookies |
| SANITY_DEPLOY_TOKEN | Project Editor robot token for private deployment records |
| SANITY_WEBHOOK_SECRET | Signature shared with the Sanity webhook |
| GITHUB_DEPLOY_TOKEN | Fine-grained token: this repository, Actions read/write |
| DEPLOY_CALLBACK_SECRET | Signature shared with the GitHub Actions callback |

None uses a PUBLIC_ or SANITY_STUDIO_ prefix. Never paste credentials into source,
chat or browser bundles. The callback secret also belongs in GitHub Actions secrets.
Routine article writing does not require setup commands or credentials.

Initial bootstrap, from studio/ after owner authentication:

```sh
npx sanity login --provider github
npx sanity exec ../scripts/setup-publishing.ts --with-user-token
npx sanity exec ../scripts/seed-authoring-proof.ts --with-user-token
```

The seed does not overwrite edited drafts. Its Gaussian figure is an analytical
reference, not a physical measurement or benchmark. The one-time
`migrate-publishing-seed-ids.ts` converts earlier dotted seed IDs and references
atomically. Sanity dotted IDs are private subpaths; public taxonomy IDs must stay
at the root. Old migrated records are retained privately and hidden from pickers.

## Writing and publishing

1. Open Studio, sign in with GitHub and create a Post.
2. Write ordinary paragraphs using the heading, list, link and formatting toolbar.
3. Paste a screenshot at the cursor with Ctrl+V or use the image picker/drop target.
   Add alt text and captions; scientific images retain their aspect ratio.
4. Insert equation, code, table, figure or callout blocks. Equations provide live
   KaTeX preview, tables accept tab-separated cells and references are reusable.
5. Use **Preview → Refresh preview** for the saved draft's actual Astro layout.
6. Publish. After production setup, status advances from CMS publication through
   deployment to **Live on dhsh.in** only when the public manifest matches the
   document revision. A failed build leaves the previous site live.

Double-click structured blocks to edit their fields. Cover images are optional.
Language defaults to Korean, author to Dong-Ha Shin and slug to the title. Dates
and reading time are automatic; advanced SEO is collapsed. Slug/language lock
after first publication, including after unpublish, preserving existing URLs.
Intentional published-slug changes are currently unsupported.

Translations are explicitly linked; untranslated posts are valid. Series order
controls previous/next navigation. Figure/equation references use stable keys and
renumber after reordering. Demo blocks select registered components and bounded
parameters; CMS article content cannot execute arbitrary JavaScript.
Choose **Organize → Related projects** to link an article with an existing project
such as PADO. Both the article and Projects index update automatically on publish;
no hand-edited reverse links are needed.

Unpublish triggers a fresh static deployment. After success, the old URL returns
404 and disappears from listings, RSS, sitemap and search. The draft and its
canonical slug remain in Studio for editing and republishing.

## Production authoring deployment

1. Create a separate Vercel project for this repository using Node 24. Keep public
   GitHub Pages and apex DNS unchanged. The repository's vercel.json runs
   `node scripts/build-authoring.mjs` after `npm ci`, building only authoring.
2. Configure the six server environment variables above. Limit the GitHub token
   to edengloria/dong-ha_page with Actions permission; no Contents write or broad
   account token is needed. Register credentials through authenticated tooling.
3. Assign studio.dhsh.in in Vercel. Add the exact DNS record supplied by Vercel at
   Porkbun and verify HTTPS. Do not guess the target or modify apex records.
4. Add https://studio.dhsh.in as a credentialed Sanity CORS origin. Studio uses
   /studio/ with a root redirect; previews and APIs share the same origin.
5. From studio/, run `npx sanity exec ../scripts/setup-publishing-services.ts
   --with-user-token`. It saves missing local secrets, configures the GitHub
   callback secret, and creates/updates a **disabled** webhook. Sanity requires
   the hostname to resolve even for a disabled webhook.
6. Merge the reviewed code so main contains the cms_event workflow input and
   status callback. Deploy authoring from the same source revision.
7. Rerun the setup command with ENABLE_PUBLISHING_WEBHOOK=1 to enable it. Test
   publish/update/unpublish using a temporary noindex post, including actual
   public HTML, manifest, search/index generation and old URL removal.
8. Verify preview authentication, deployment status and owner writing comfort
   before considering rollout complete, then publish reviewed real content.

The webhook verifies a timestamped HMAC, size, project/dataset/type, ID and revision.
Persistent revision-locked leases deduplicate deliveries. It dispatches only the
existing deploy.yml workflow on main. Deployment records are private subpaths.
GitHub callbacks are signed; completion additionally requires the public manifest
to contain the matching workflow run ID.

## Verification

```sh
npm run lint
npm run check --workspace studio
npm run test:publishing
npm run build
npm run build:preview
# Set VERCEL=1 in the environment:
node scripts/build-authoring.mjs
npm run test:visual
```

CI builds both applications and runs unit, functional and Linux screenshot checks.
DOCUMENT_VISUAL_TEST=1 enables deterministic synthetic articles only for tests;
production deployment rejects that flag. Tests cover static HTML without JS,
Korean/English search, metadata, series, 390–1440 px reading layouts and demo code
loading only when a registered demo is present.

With preview running, from studio/:

```sh
npx sanity schema validate
npx sanity exec ../scripts/check-private-preview.ts --with-user-token
```

From the root, `node scripts/check-webhook-rejection.mjs` checks unsigned, stale,
draft and oversized requests against the real local endpoint without deployment.
The authoring build scans browser output for configured secrets. Public document
audits reject framework runtimes on reading pages.

Real Chrome checks passed for clipboard PNG insertion, media reuse, equation
editing, Python paste, table editing, automatic/manual slugs, first publication,
immediate republish during autosave and unpublish. A real OS file drop and owner
comfort review still need confirmation. Native publication deliberately uses
Studio's mutation queue; an independent read/patch/publish sequence caused an
observed revision conflict during autosave.

Linux comparisons reviewed intentional navigation additions: 10 desktop/mobile
baselines changed; tablet baselines stayed unchanged. Existing Playwright 1.51
and Sharp 0.34 audit findings remain a separate tested tooling-update task.

## Ownership and backup

See [BACKUP.md](BACKUP.md) for full documents/media export, checksums, restore into
a separate dataset and migration away from Sanity. A real export containing drafts
and original assets was restored into the separate private restore-check dataset:
41 content documents, 2 original image hashes/dimensions and 2 rendered drafts
passed comparison; anonymous queries exposed no documents. See the read-only
verification command and export media format details in BACKUP.md.

Published documents and uploaded asset URLs are public. Authenticated drafts do
not make asset URLs private storage. Keep confidential research, embargoed figures,
company material and credentials outside this publishing asset system.
