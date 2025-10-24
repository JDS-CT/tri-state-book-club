# CHANGELOG

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
