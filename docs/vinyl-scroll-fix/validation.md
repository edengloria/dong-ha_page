# Vinyl preview and scroll correction

Base: `8df5868` (deployed WebGL2 change). Tested on Windows Chrome 153.0.8010.48.

## Reproduction and changes

- Real requests for Queen returned HTTP 200 with zero results in the KR iTunes
  storefront. The existing player searched only KR and permanently cached misses.
  The same query in US returns a playable preview. The search now tries KR, US,
  then JP for each distinct query, caches only successful previews, and cancels
  work when a card becomes inactive. Region/catalog availability still varies;
  this does not promise a preview for every record.
- Playback starts directly with `play()` rather than waiting for
  `canplaythrough`. `NotAllowedError` offers a real inline Play button whose click
  does not open album details. Network/media errors offer Retry. The fade starts
  at nonzero volume so audible playback permission is requested immediately.
- Scroll previously kept backdrop filters on document-height panels and their
  nested glass layers, and transitioned those filters as scrolling started.
  During scrolling only, these filters/transitions are disabled. The existing
  tint, borders and idle glass effect remain. The background overlay pauses at
  its current animation opacity rather than jumping to fully opaque.
- Vinyl tilt work is coalesced to one pending animation frame and cancelled on
  leave/unmount. Only the active card requests persistent transform promotion.

## Validation

- Production build/static export, TypeScript and ESLint passed.
- Nine Playwright cases cover renderer lifecycle, scroll filter pause/restore,
  regional search fallback, an injected autoplay denial followed by real WAV
  playback, hover stop/re-entry, cached-media retry, transient-search retry and
  cancellation. The policy rejection is simulated because browser engagement
  policy differs between runners; actual playback uses HTMLAudioElement.
- A separate live check used Apple's real preview: audio time advanced beyond
  0.3 seconds at volume 0.5, and leaving the card paused playback.
- Linux WebGL2 screenshot suite: 15/15 passed using the snapshot-era Discogs
  input in an isolated checkout, as documented for PR #6. Current production
  Discogs data and committed baseline images were not changed.

## Scripted scroll measurements

`node scripts/profile-scroll.mjs <base-url>` samples requestAnimationFrame
intervals while scrolling the home and vinyl pages. Each of three trials collects
149 intervals after warmup. Production before and the local production export
after were sampled sequentially on the same Windows Chrome host, after loading.
These are headless scripted-scroll results, not compositor presentation times,
input latency, or a guarantee for the user's display/GPU.

| Conditions | Page | Before p95 | After p95 | Intervals over 25 ms, before → after |
| --- | --- | --- | --- | --- |
| 1440×900, DPR 1 | Home | 16.8 ms | 16.8 ms | 0 → 0 of 447 |
| 1440×900, DPR 1 | Vinyl | 16.8 ms | 16.8 ms | 2 → 0 of 447 |
| 1920×1080, DPR 2 | Home | 33.4 ms | 16.7–16.8 ms | 264 → 0 of 447 |
| 1920×1080, DPR 2 | Vinyl | 33.4 ms | 16.7–16.8 ms | 159 → 0 of 447 |

At normal resolution the repeat run was already near 60 Hz before the fix;
the high-DPI workload reproduced the sustained slowdown. Raw results are in
`normal-before.json`, `normal-after.json`, `hidpi-before.json`, `hidpi-after.json`.
Set `SCROLL_WIDTH=1920`, `SCROLL_HEIGHT=1080`, `SCROLL_DPR=2` for the latter workload.
