# TODO

TEST -- using AGENTS.md file
✅ [p1] Diagnose the awards loader regression that leaves the ceremony UI stuck on the loading screen for 2025.
✅ [p1] Add unit coverage that exercises the canonical nominations pipeline end-to-end with the awards reveal fixture to prevent the regression.
✅ [p2] Document the canonical data flow troubleshooting steps in `years/2025/README.md` so future updates can validate loader readiness.
🔲 [p3] Coordinate refreshed ceremony audio synthesis compatible with the new settings options once binary delivery is possible.
🔲 [p4] Research and document tooling to assist with ranked-choice vote aggregation ahead of winner selection.
✅ [p1] Add inline shortcuts in the diagnostics panel to open canonical nominations sources and trigger a manual reload from disk for the active year.
✅ [p2] Extend loader coverage to confirm manual refresh bypasses embedded snapshots when canonical data is available.
✅ [p1] Restore the reveal highlight animation by layering winner metadata over canonical nominations in `Awards Webpage/js/awardsLoader.js`.
✅ [p1] Extend `tests/awards-loader.test.js` with coverage that exercises the winner overlay behavior and updated expectations.
✅ [p2] Refresh `2023/README.md`, `2024/README.md`, and `2025/README.md` to replace redundant pointers with concise season summaries.
✅ [p2] Scaffold per-year `videos/` directories under `years/2023`, `years/2024`, and `years/2025` with MP4 template filenames for ceremony drops.
