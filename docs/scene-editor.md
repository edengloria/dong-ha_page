# Scene editor

Open `/scene-editor/` directly. Public pages contain no editor controls or asset
catalog requests. This is a local design tool, not an authenticated publishing
service: saving in a browser does not change anyone else's site.

* Upload PNG, JPEG, GIF or WebP, or add a text/link object. Text is plain text,
  rendered with `textContent`, never HTML. Every object can have an HTTP(S),
  mailto, root-relative or fragment link. Image descriptions label image links.
* Uploads retain the original raster data and a still frame for reduced motion.
  Limit: 2 MB per upload, 16 million decoded pixels, 4 MB per complete JSON file.
  Export includes the images; no separate image hosting is needed. Browser
  storage quotas vary: a failed save leaves the editor intact for export.
* Shift/Ctrl/Command-click selects multiple objects. Drag or use arrow keys
  (Shift = 10 pixels). The corner handle resizes around the horizontal centre;
  a panel-edge attachment keeps its bottom attached. Alt bypasses the grid.
* Layer order applies within each region and foreground/background layer.
  Lock protects against movement, property edits, reordering and deletion.
  Alignment uses the last selected object's unrotated rectangle. Duplicates
  are unlocked and offset 16 screen pixels in the current viewport mode.
* Ctrl/Command+Z undoes, Shift+Z redoes, D duplicates, S saves. Text inputs keep
  their native editing shortcuts. Escape cancels an active drag. These shortcuts
  exist only in the editor. Undo keeps up to 50 edits for this editing session.
* Position, size, visibility, background geometry, padding and font size are
  separate at the existing 560px mobile breakpoint. Change the window width to
  edit that mode. Colours, fonts, borders, text, links and locks are shared.
* Export `scene-layout.json`, review it, then commit to `data/scene-layout.json`.
  The existing static Pages build bakes the same objects into public HTML.
  Old version-1 files remain valid; new fields are optional and validated.

The public presentation uses the document conventions documented in
[HTML 3.2 (1997)](https://www.w3.org/TR/2018/SPSD-html32-20180315/) and
[CSS1 (1996)](https://www.w3.org/TR/REC-CSS1/): a presentation table, local tiled
images/GIFs, Times text, ordinary blue/purple links, horizontal rules and
outset/inset borders. The fake desktop title bar is removed. This is not a
claim of Netscape compatibility: responsive anchoring, reduced motion, audio,
the editor and ThorVG still use modern browser APIs. Authored scene coordinates
and panel attachments are retained. Asset provenance remains in the archive
metadata; the visible credit sentence is removed.
