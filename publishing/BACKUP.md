# Content ownership, export and recovery

The website owns canonical URLs. Sanity stores open JSON/Portable Text documents;
all renderers and schemas live in this repository. No proprietary HTML or arbitrary
JavaScript is stored in an article.

## Export

After logging into Sanity locally, run `node scripts/backup-publishing.mjs` from the
repository root. It creates a uniquely dated `.tar.gz` plus SHA-256 checksum in
ignored `backups/`. It includes posts (published and drafts), taxonomy, series,
authors, reference records, site settings, media metadata, original images and
files. Internal preview secrets and deployment records are excluded by type.
Existing exports are never overwritten. The CLI validates asset hashes; review
any skipped/missing-asset warnings before calling an export complete.

Keep a private copy on a second device or your own backup storage. Do not put a
draft-containing archive in the public repository, website, or public CI artifacts.
Export before migrations and periodically while actively writing. Credentials and
hosting environment configuration are managed separately from content backups.

## Restore safely

1. Verify the archive checksum and list its entries (`tar -tzf <archive>`).
2. From `studio/`, create a separate test dataset using `npx sanity dataset create
   restore-check --visibility private`. Never overwrite production for a drill.
3. Run `npx sanity dataset import <absolute archive path> restore-check`.
   Keep asset verification enabled. Import the archive, not only `data.ndjson`,
   so image/file binaries are restored and references are rewritten correctly.
4. Compare document counts, IDs, slugs/languages, body blocks, references and media
   dimensions with the original export. Preview representative Korean/English
   articles including math, code and figures against the restored dataset.
   For this project's private `restore-check` dataset, set `PUBLISHING_BACKUP` to
   the absolute archive path and run `npx sanity exec
   ../scripts/check-publishing-restore.ts --with-user-token` from `studio/`.
   This read-only verifier checks the archive checksum, exact document content,
   restored references, original asset bytes/dimensions, shared article rendering
   and absence of anonymous document access. It never changes production.
5. Switch the public build and Studio project/dataset configuration only after
   review, or import into an empty replacement production dataset during planned
   recovery. Recreate CORS, robot tokens, webhook and server secrets separately.
   Do not use `--replace`, `--missing` or asset-bypass flags blindly.

## Migrate away from Sanity

Extract `data.ndjson`, `assets.json`, `images/` and `files/`. Preserve each post's
language and slug as its URL. Resolve `_ref` relationships by `_id`; keep `_key`
values because figure/equation references use them. Exports represent media with
`_sanityAsset` markers such as `image@file://./images/hash-1200x800.png` instead of
the live `asset._ref`. Resolve these archive-relative paths and retain the matching
`assets.json` metadata; the official importer reconstructs asset references.
Map Portable Text paragraphs,
marks and structured objects with `lib/publishing/types.ts` and `render.ts` as the
format contract. Move original asset binaries to your own storage and replace
`imageAsset()` URL resolution. Preserve dates, citations, alt text, caption,
credits, translations and series order. The Astro public routes need no URL change.

## Verified restore drill

On 2026-09-27, the full export was imported into the separate **private**
`restore-check` dataset. All 41 content documents matched the archive, both images
matched their original SHA-1 hashes and dimensions, and both restored drafts
rendered through the shared article renderer. Anonymous querying exposed zero
documents. The dataset remains available for inspection; production was unchanged.

Ordinary Sanity image delivery may strip metadata and therefore have different
bytes from the upload. Exact byte verification uses authenticated `dlRaw` against
the allowlisted Sanity asset host; never add that credential to public image URLs.
The export itself contains the original bytes. Public click-to-expand links serve
the full-resolution image, not a promise of byte-identical original metadata.

References: [Sanity export](https://www.sanity.io/docs/content-lake/exporting-data),
[import including assets](https://www.sanity.io/docs/content-lake/importing-data),
[original image downloads](https://www.sanity.io/docs/content-lake/image-urls).
