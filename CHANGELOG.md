# CHANGELOG

## 2025-10-27T14:30:00Z
- fix: align Min's supporting character entry with the "Rook" title in `years/2025/nominations/2025-award-nominations.json` and regenerate the embedded snapshot for the ceremony site.
- chore: update `years/2025/voting/2025-ranked-ballot-options.md` so the ranked ballot reference lists Min (the Rook).
- test: extend `tests/awards-loader.test.js` to guard the Min (the Rook) nomination output.

## 2025-10-27T03:15:00Z
- fix: unblock the awards loader offline regression by generating canonical snapshots via `scripts/generate-embedded-awards-data.js` and refreshing `Awards Webpage/js/embeddedAwardsData.js`.
- fix: allow `Awards Webpage/js/awardsLoader.js` to hydrate embedded snapshots directly when fetch/XHR are unavailable, improving diagnostics coverage.
- test: extend `tests/awards-loader.test.js` with embedded snapshot parity checks and fallback coverage for 2025 canonical data.
- docs: note the regeneration and troubleshooting workflow in `years/2025/README.md` so editors can verify the loader pipeline.

## 2025-10-26T18:15:00Z
- feat: complete p1 nomination intake – Logged Sylvia's final responses in `years/2025/nominations/2025-raw-submissions.md` alongside Chris and Ivy.
- feat: complete p1 normalization pass – Populated `years/2025/nominations/2025-award-nominations.json` with merged nominees, aliases, and ranked mentions for all three submitters.
- feat: complete p2 ballot prep – Added `years/2025/voting/2025-ranked-ballot-options.md` and synchronized `Awards Webpage/js/script_2025.js` to display the consolidated nomination slate for voting setup.

## 2025-10-25T11:57:48Z
- feat: complete p1 source management controls – Added diagnostics shortcuts in `Awards Webpage/index.html`, `css/styles.css`,
  and `js/script.js` so editors can open canonical nominations and trigger manual reloads without digging through folders.
- test: complete p2 canonical refresh coverage – Expanded `tests/awards-loader.test.js` and loader options to verify the new
  disableEmbedded path ensures fresh data is fetched when the UI requests a manual refresh.

## 2025-10-25T02:45:00Z
- feat: synthesize a Four-Dimensional Tombstone winner cue via `Awards Webpage/js/audioCues.js`, exposing a reusable ceremony audio manager.
- feat: integrate the cue manager with `Awards Webpage/js/script.js`, the ceremony settings UI, and embed the new script in `Awards Webpage/index.html`.
- test: add audio cue manager regression coverage and ensure the Tombstone option surfaces in `tests/settings-manager.test.js`.

## 2025-10-25T01:05:00Z
- feat: restructure diagnostics console into a dedicated tab and aligned layout within `Awards Webpage/index.html` and `css/styles.css`.
- feat: add configurable ceremony settings with persisted audio selections via `js/settingsManager.js`, updated `js/script.js`, and UI wiring.
- chore: expand `years/2023/reveal/awards.json` with templated categories and archival data annotations; mirror updates in embedded fallback data.
- chore: capture partial 2025 awards nominations in `years/2025/reveal/awards.json` and synchronize the embedded fallback catalog.
- test: cover settings persistence and normalization in `tests/settings-manager.test.js`.

## 2025-10-25T00:10:00Z
- chore: prune TODO backlog – Removed resolved navigation, loader, and diagnostics items from `TODO.md` in favor of existing changelog entries.


## 2025-10-24T22:06:42Z
- feat: embed awards fallback catalog – Added `Awards Webpage/js/embeddedAwardsData.js` with deep-frozen 2023-2025 ceremony data so offline diagnostics can recover.
- fix: load embedded awards data when network strategies fail – Updated `Awards Webpage/js/awardsLoader.js` to consult the embedded catalog and emit detailed diagnostics events.
- test: verify embedded fallback path – Extended `tests/awards-loader.test.js` with a node:test case that forces fetch/xhr failures and confirms the fallback loads successfully.

## 2025-10-24T21:23:10Z
- fix: bypass hanging fetch on file origins – Updated `Awards Webpage/js/awardsLoader.js` to detect `file://` contexts and immediately use the resilient XHR path so ceremony data loads offline.
- test: guard file-origin loader path – Added a node:test case in `tests/awards-loader.test.js` that stubs the global location and verifies no fetch attempts occur while 2024 data still loads.

## 2025-10-24T15:24:24Z
- fix: add offline-friendly loader fallback – Updated `Awards Webpage/js/awardsLoader.js` to fall back to XMLHttpRequest when `fetch` is unavailable so the ceremony works over `file://` URLs.
- test: cover loader fallback – Extended `tests/awards-loader.test.js` with an offline scenario harness that exercises the new XMLHttpRequest path.

## 2025-10-24T14:57:39Z
- fix: restore awards loader fallback – Updated `Awards Webpage/js/awardsLoader.js` with multi-path retries and added regression coverage so the ceremony can recover 2024 data when relative directories differ.
- feat: background awards word cloud – Added `js/backgroundWords.js`, animated styling, and DOM updates so completed nominations and winners drift across the backdrop for the selected year and earlier.

## 2025-10-24T12:14:00Z
- feat: complete p1 navigation views outline – Captured the tabbed layout blueprint in `docs/navigation-views.md` covering reveal, nominations, winners, data exchange, and voting prototypes.
- feat: complete p1 awards UI refactor – Rebuilt `Awards Webpage/index.html` and `css/styles.css` with multi-tab navigation, panels, and accessibility improvements for ceremony content.
- feat: complete p1 multi-view controller – Extended `Awards Webpage/js/script.js` with tab management, data-driven renderers, and a ranked voting prototype tied to the live awards dataset.
- feat: complete p1 ranked ballot schema – Authored `docs/ranked-ballot-format.md` and the shared `js/votingFormat.js` helpers for importing/exporting ranked ballots.
- feat: complete p2 voting helper tests – Added `tests/voting-format.test.js` to validate ballot creation, envelope export, and schema parsing workflows.

## 2025-10-24T10:22:46Z
- feat: complete p1 memory-aid audit – Cataloged 2023 consolidated notes to define per-book outputs for legacy seasons.
- feat: complete p1 memory-aid migration – Split 2023 notes and authored 2023/2024 memory aid files under the shared template.
- feat: complete p1 synopsis backfill – Summarized missing 2023 and 2024 picks with standardized synopses and key characters.
- feat: complete p2 bookshelf refresh – Updated 2023 and 2024 book READMEs and reading logs to link directly to memory aids.
- feat: complete p3 cross-year index – Published `years/memory-aids-index.json` for quick search of characters, twists, and highlights.

## 2025-10-24T05:10:00Z
- feat: centralize awards reveal assets – Created `reveal/` directories for each year with archived HTML, JSON exports, and placeholders for upcoming media, plus documented the ceremony workflow.
- feat: data-driven awards webpage – Refactored the awards site to load per-year JSON via a shared loader module, refreshed the template controls, and added a regression test for the loader.

## 2025-10-24T10:29:58Z
- feat: complete p2 annual awards workflow doc – Authored `docs/workflows/annual-awards.md` detailing nomination, tally, reveal, and archive steps with pointers to `years/<year>/` assets.

## 2025-10-24T04:05:00Z
- feat: define shared data schemas – Documented normalized nominations, ranked results, and raw submission exports, plus reorganized 2025 memory aids under the new template.

## 2025-10-24T03:15:00Z
- feat: complete p1 archive restructure – Created the `years/` hierarchy with standardized per-year subfolders, migrated existing materials, and refreshed docs/links to the new paths.

## 2025-10-24T02:32:00Z
- chore: remove legacy award source binaries – Deleted migrated 2023 `.docx` files and deduplicated `2024 Awards.html` so the repository only keeps the version under `Awards Webpage/`.

## 2025-10-24T02:20:05Z
- feat: completed p2 award history migration prep – Converted 2023 `.docx` notes into Markdown/JSON and documented the workflow in `docs/award-history-migration.md`.

## 2025-10-24T02:07:20+00:00
- feat: complete p1 nomination capture – Recorded Chris and Ivy raw submissions in `years/2025/nominations/2025-raw-submissions.md`.
## 2025-10-24T11:30:00Z
- feat: add diagnostics telemetry to the awards loader – instrumented `js/awardsLoader.js` with structured logging hooks and exposed a diagnostics channel factory.
- feat: add on-page diagnostics console – embedded a control panel in `Awards Webpage/index.html` with actionable buttons, styles, and clipboard-friendly output driven by `js/diagnosticsConsole.js` and updated `js/script.js`.
- test: extend diagnostics coverage – expanded `tests/awards-loader.test.js` and introduced `tests/diagnostics-console.test.js` to cover the new logging paths and console behavior.

