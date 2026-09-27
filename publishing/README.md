# dhsh.in authoring proof — Phase 1

This is the private authoring/preview application. The public website remains the
existing static Astro build deployed by GitHub Pages. No public blog routes or
publishing webhook have been enabled yet. Progression to Phase 2 is gated on the
owner trying the writing experience.

## Run locally

Use Node 24 and run `npm ci` from the repository root. Then, in two terminals:

```sh
npm run dev:studio
npm run dev:preview
```

Open `http://127.0.0.1:3333/`. Sign into Sanity using GitHub. Open **Posts → Angular
Spectrum Method를 PyTorch로 구현하기**. The preview server runs on port 4322;
open it through the Studio's **Preview** tab to authenticate. A direct anonymous
request to the preview is rejected.

Project: `f0xserx3`; dataset: `production`. These identifiers are public, not
credentials. A read-only project robot token and a random preview session secret
must exist in ignored `publishing/.env.local`:

```dotenv
SANITY_READ_TOKEN=<project viewer token>
PREVIEW_SESSION_SECRET=<at least 32 random characters>
```

The owner-authenticated bootstrap is run once from `studio/`:

```sh
npx sanity login --provider github
npx sanity exec ../scripts/setup-publishing.ts --with-user-token
npx sanity exec ../scripts/seed-authoring-proof.ts --with-user-token
```

The seed creates only an unpublished example draft and never overwrites it on
subsequent runs. Its figure is an analytical Gaussian reference, not a physical
measurement or a benchmark of the example Python code.

## Writing

- Write ordinary paragraphs; use the toolbar for headings, lists and links.
- Paste a screenshot at the text cursor with Ctrl+V. Figures also expose a file
  picker, drag target and reuse of uploaded media. Add alt text and a caption.
- Double-click a block to edit it. Equations show a live KaTeX preview. Code has a
  language selector, filename, line highlighting and caption. Tables support
  direct cell edits and pasted tab-separated cells.
- **Preview → Refresh preview** loads the latest saved draft using the shared
  Astro article component. Desktop/Mobile controls change the preview width.
- The title generates a URL name automatically until it is edited manually.
  After first publication, the language and URL name are locked. Titles and
  categories remain editable. Translation pairs can share a slug across languages.
- **Publish currently only publishes to Sanity Content Lake. It does not deploy
  an article to dhsh.in yet.** The deployment/status workflow is Phase 3.

## Checks

```sh
npm run check --workspace studio
npm run test:publishing
npm run lint
npm run build:studio
npm run build:preview
npm run build
```

With both development servers running, from `studio/`:

```sh
npx sanity schema validate
npx sanity exec ../scripts/check-private-preview.ts --with-user-token
```

The real-service check validates the Sanity preview secret, HttpOnly session,
anonymous/invalid-secret rejection, no-store headers and complete article HTML.
No draft content, read token or session secret belongs in the public site's build.

## Hosting and content ownership

`studio.dhsh.in` still needs a separate authoring host and a Porkbun DNS record.
The public Pages deployment is preserved. The authoring service will host the
Studio, private previews and the verified webhook; it will not serve canonical
public article URLs.

The dataset's published documents and uploaded assets are public. Draft documents
need authentication, but image asset URLs are not private storage. Upload only
material safe for this asset architecture; keep confidential research, embargoed
figures, company data and credentials elsewhere.

Documents use Portable Text and stable references; media uses Sanity asset IDs.
Keep schemas and rendering code in Git. The full export/restore procedure and
scheduled backups are still to be implemented before production publishing.

## Remaining verification before production

- Owner's writing-comfort review and a real OS file drop. Clipboard PNG paste,
  media reuse, live equation editing, Python paste and table cell edits were
  exercised in Chrome against the real Content Lake. The browser automation's
  file chooser/drop capability could not complete the OS upload test.
- Automatic slug generation and preservation of a manually chosen slug were
  exercised in Chrome. First/repeat/unpublish actions still need browser workflow
  coverage before the public publishing pipeline is enabled.
- The new Sanity CLI dependency findings are addressed with targeted root
  overrides. The root scripts import the CLI directly, so Sanity is also an
  explicit root development dependency. This avoids npm's workspace-link override
  propagation issue. Existing Playwright 1.51 and Sharp 0.34 audit findings still
  need a separate tested tooling update; the screenshot browser stays unchanged
  for this authoring proof.
