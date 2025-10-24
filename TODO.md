# TODO

TEST -- using AGENTS.md file
✅ [p1] Restore awards data loading so selecting 2024 (and earlier years) renders ceremony content from `years/<year>/awards.json`.
✅ [p1] Add regression tests in `tests/awards-loader.test.js` covering successful data fetch and rendering for the default year.
✅ [p2] Implement animated background that drifts award-related words from the selected year and earlier using the existing layout.
✅ [p2] Ensure background word animation logic is testable with unit coverage for filtering eligible terms.
✅ [p2] Document annual awards workflow referencing `years/<year>/` archives.
✅ [p1] Restore awards loader support when running the site over file:// by adding a resilient fallback in `js/awardsLoader.js`.
✅ [p1] Add regression tests in `tests/awards-loader.test.js` covering the new offline-safe loading path.
🔲 [p3] Plan website updates so the awards site can surface multiple years with navigation and data-driven pages.
🔲 [p4] Research and document tooling to assist with ranked-choice vote aggregation ahead of winner selection.
