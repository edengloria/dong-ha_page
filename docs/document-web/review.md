# Pre-merge review

Reviewed the public export boundary, native enhancements, scene persistence,
content routes, and visual changes against main
`56abb431ea5d4a41661a7d453acb41e705a19217`.

No remaining blocking findings.

- Public output contains full content and normal anchors with no Next bootstrap
  or React runtime dependency. The test checks network requests and actual
  document replacement, not just bundle names. The production build rejects
  incomplete exports and accidental framework imports. Editor/admin HTML is
  excluded; editor links cannot enter public pages through the Next router.
- Photo indexing reaches all 89 originals without JavaScript. Each of 57 record
  detail documents returns its corresponding Discogs link. Metadata and existing
  public URLs remain available. Keyboard photo navigation returns focus.
- Audio work has one owner. Leaving a card invalidates the request, aborts its
  search, cancels its fade, and releases audio. Play/Retry and mobile toggles use
  real media playback in tests with a deterministic WAV and mocked search data.
- Saved scene data is validated before style/path insertion and shares the same
  coordinate helper as React previews. No catalog/editor code enters public
  modules. Invalid saves restore the published layout. Panel-top attachments and
  sidebar foreground behavior remain covered on home and inner routes.
- Found and corrected percentage table-cell sizing during implementation; the
  final table matches the original FHD boxes. Found and corrected base-path
  route classification using a separate `/subpath` export.
- Reviewed Linux differences before refreshing all 15 baselines. Final Linux
  comparisons passed. The background and saved scene files did not change;
  the typography, bevels, link treatments, native album pages, and paginated
  natural-aspect photographs are intentional.

The post-export step depends on Next producing complete static markup. Its
guards plus the real-export tests must remain enabled when upgrading Next.
Optional media enhancement failure leaves ordinary links and static artwork.
The editor/admin still require JavaScript. Existing remote Discogs covers and
iTunes search availability remain external dependencies.

See [validation and measurements](README.md) for exact evidence and limits.
