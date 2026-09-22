# Responsive scene anchors

Desktop placements in `data/scene-layout.json` now specify an `anchor`. Their
`x` and `y` are percentages of that region; `width` is the CSS-pixel width in
the FHD reference composition. Width scales down with the anchor, never up.
Placements without an anchor retain the original viewport-percent x / pixel y
semantics, including the separately curated mobile scene.

`data/scene-reference.json` records Windows Chrome region boxes at 1905 CSS px
(1920 px FHD less the 15 px scrollbar), with the owner's published layout.
Converting back through those reference boxes preserves every original desktop
position and width. The Windows browser comparison measured a maximum rounding
difference below 0.02 CSS px. The automated browser test allows font/layout
rounding within 2 px.

Region geometry updates after layout/resize, content changes and font loading;
there is no scroll handler or continuous animation loop for positioning.
Missing homepage sections on inner routes use their reference offsets inside
the current main panel. Those decorations remain behind the panels. Foreground
assets anchored to `sidebar` or `sidebar-extras` stay above the left panel on
every route; all other foreground placements are shown above panels only on
the homepage and scene editor.

The editor's “붙일 영역” selector converts coordinates while retaining the
current visible position. Dragging and keyboard movement operate in screen
pixels and convert back to the chosen anchor. Existing browser saves migrate
only desktop placements that still match the original export. Custom edits
and all separately edited mobile positions remain intact.
