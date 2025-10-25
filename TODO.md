# TODO

TEST -- using AGENTS.md file
✅ [p1] Move the diagnostics console into a dedicated "Diagnostics" tab within `Awards Webpage/index.html`.
✅ [p1] Update the tab controller in `Awards Webpage/js/script.js` so the diagnostics view registers correctly and refreshes when activated.
✅ [p1] Expand `years/2023/reveal/awards.json` to follow the 2024 schema, filling known data and annotating gaps for missing records.
✅ [p1] Draft a partial 2025 awards dataset in `years/2025/reveal/awards.json` using available nominations and clearly marking outstanding responses.
✅ [p2] Add a "Settings" tab to `Awards Webpage/index.html` with dropdowns for winner and reveal sound effects.
✅ [p2] Persist the selected sound effect settings in `Awards Webpage/js/script.js`, including unit tests covering defaults and custom choices.
✅ [p1] Append Sylvia's raw submission to `years/2025/nominations/2025-raw-submissions.md` using the existing formatting conventions.
✅ [p1] Normalize 2025 nominations from Chris, Ivy, and Sylvia in `years/2025/nominations/2025-award-nominations.json`, merging duplicate nominees and preserving rank order.
✅ [p2] Publish a ranked-choice ballot reference in `years/2025/voting/2025-ranked-ballot-options.md` summarizing the full nomination slate per category.
✅ [p1] Map canonical nomination sources for each ceremony year within `years/*/nominations`, documenting which file supplies human-maintained data for the loader.
✅ [p1] Refactor `Awards Webpage/js/awardsLoader.js` (and dependent scripts) so awards data is harvested at runtime from the canonical nomination sources instead of static JS snapshots.
✅ [p1] Remove redundant nomination arrays from `Awards Webpage/js/embeddedAwardsData.js` and `Awards Webpage/js/script_2025.js`, ensuring they delegate to the runtime loader.
✅ [p1] Add unit coverage proving the loader correctly derives display nominations from the canonical files for at least the 2025 season.
✅ [p2] Document the new single-source workflow in the relevant README under `years/2025` so future updates touch only the canonical data.
🔲 [p3] Coordinate refreshed ceremony audio synthesis compatible with the new settings options once binary delivery is possible.
🔲 [p4] Research and document tooling to assist with ranked-choice vote aggregation ahead of winner selection.
