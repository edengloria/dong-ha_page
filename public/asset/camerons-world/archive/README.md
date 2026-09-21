# Complete referenced image archive

Source: https://www.cameronsworld.net/ (retrieved 2026-09-22).

The site's own HTML, both linked stylesheets and both linked scripts reference
2,048 same-origin image URLs. 1,992 original files were downloaded unchanged;
56 return HTTP 404 on the source site. The complete list, source-document hashes,
image hashes/dimensions and unavailable URLs are in `catalog.json`. No unavailable
file is presented as successfully archived.

All 602 CSS sprite-atlas rectangles are additionally extracted as individual PNGs
under `extracted/`. Each catalog entry records the original atlas, crop rectangle
and CSS selector. These are explicitly derived images, not original standalone
files. Some overlap the standalone collection. `thumbs/` contains small still WebP
previews; `stills/` contains first-frame PNGs of animated originals for reduced
motion. Original animation bytes remain intact under `img/`.

Reproduce/update with `node scripts/archive-camerons-world.mjs` from the repository
root. It fetches only source files and images, never executes source-site scripts,
and reuses cached originals. The scene editor loads the catalog only on its route
and shows 36 still thumbnails per page. Public pages load only their placed images.

Graphics were assembled by Cameron Askin from various GeoCities archives.
Attribution does not imply a blanket license for those historical graphics.
