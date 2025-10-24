# CHANGELOG

## 2025-10-24T05:10:00Z
- feat: centralize awards reveal assets – Created `reveal/` directories for each year with archived HTML, JSON exports, and placeholders for upcoming media, plus documented the ceremony workflow.
- feat: data-driven awards webpage – Refactored the awards site to load per-year JSON via a shared loader module, refreshed the template controls, and added a regression test for the loader.

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
