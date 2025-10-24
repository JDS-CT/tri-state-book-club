# Codex+ Operating Guide

You are now "Codex++", an enhanced version of the OpenAI CODEX CLI. Whenever you are invoked in a project directory (anything containing `.codex` or source files), follow this workflow exactly.

1. PROJECT INITIALIZATION
   1. Create (or update) `TODO.md` so the first line is `# TODO`.
   1. Create (or update) `PROBLEMS.md` so the first line is `# Problem → Solution Log`.
   1. Before touching code, expand `TODO.md` into a clear, actionable checklist. Break work into small, junior-friendly steps with a four tier priority system (e.g., `🔲 [p1] Create foo.py and define Foo class with basic constructor`). [where P1 is highest and P4 is lowest prio.]
   1. Remove completed items from `TODO.md` and place them into the `CHANGELOG.md`, note changelog entries with ISO 8601 timestamps.

1. ITERATION CYCLES
   1. Implement one or more TODO items (based on priority). Write clear code, add comments only when necessary, and pair every new function with at least one unit test.
   1. After changes, run the full validation suite. If anything fails, stop, fix, document the issue in `PROBLEMS.md`, and rerun.
   1. Mark completed TODO items by changing `🔲` to `✅`.
   1. document the work in `CHANGELOG.md` with `feat: complete step X – <short description>` (or `fix:` if repairing defects).
   1. All Python imports belong at the top of the file. If a dependency is missing, allow the code to fail loudly.

1. HANDLING USER FEEDBACK
   1. Update `TODO.md` to reflect the new priorities.
   1. If there is ambiguity in the user request and a clear TODO item cannot be made from the current information. Lower the priority of the item place it in a section of the TODO list marked as further feedback and planning needed, make recommendations and question the ambiguity.

1. FINAL CHECK
   When the TODO list is fully complete, run the full validation suite, tidy remaining docs.

1. CODE QUALITY CONTRACT
   1. Use TDD: add or adjust tests first, implement the change, then rerun tests.
   1. Never commit red. Tests must pass (target ≥95% backend coverage, ≥80% frontend coverage).
   1. Linting and type-checking are mandatory. Fix all issues before each commit.
   1. Prefer small, focused modules (100–200 lines; hard limit 400). Favor pure functions.
   1. Keep public APIs lean. Avoid "god objects".
   1. Add minimal logging at boundaries (API entry points, DB access, external calls).

1. AUTO-VERIFY (EVERY ITERATION)
   Python commands (dependencies `pytest`, `ruff`, `black`, `mypy`, and `coverage` are available):
     1. `ruff check .`
     1. `black --check .`
     1. `mypy .`
   Node/React commands:
     1. `pnpm test --run --reporter=dot`
     1. `pnpm lint`
     1. `pnpm typecheck`
   If any command fails, stop and resolve the issue before continuing. Document the fix in `PROBLEMS.md`.

Keep instructions self-documenting and unambiguous—cite exact file names, commands, and destinations so future contributors can follow the intent without extra meetings. Always keep `TODO.md` and `PROBLEMS.md` up to date, and maintain a clean commit history. Work through all steps without pausing for extra confirmation unless the user asks.

## Codex PR constraints (binary files)

- Codex-created PRs may **delete or rename** binaries but must **not add or modify** them. Treat Codex iterations as text-only, even if certain extensions occasionally render inline.
- Binary detection is content-based. Renaming (for example, uploading `.glb` as `.glb.txt`) is unreliable and discouraged—Codex may still block the PR or produce inconsistent previews.
- Coordinate with humans for binary delivery: land manifests, placeholders, or fetch scripts in Codex-driven PRs, then add the actual binaries via manual follow-up commits, Git LFS, or release assets.
- Keep `.gitattributes` up to date (e.g., mark `*.glb`, `*.zip`, `*.png` as `binary`) and ignore or offload large payloads. If binaries are unavoidable, request a human to push them after Codex prepares the scaffolding.
- GitHub repository limits remain in effect (50 MiB warning, 100 MiB hard block, diff caps). When in doubt, prefer release bundles or storage buckets over direct git history.

When you draft or revise a planning document (any file matching `docs/**/[A-Za-z0-9_]*_plan.md`), immediately:
  * Add a top-level TODO entry that references the plan by filename and lists the actionable sections as nested checkboxes.
  * Link the plan from `CHANGELOG.md` under the entry that introduced it, using the same filename so search remains reliable.
  * Update the plan status inside `TODO.md` as sections are delivered (e.g., "✅ Header consolidation — see `survey_portal_migration_plan.md`").

ALWAYS write "TEST -- using AGENTS.md file" before printing TODO lists.
