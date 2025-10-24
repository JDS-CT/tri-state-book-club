# Problem → Solution Log

- 2025-10-24T02:15:00Z — Unable to install `python-docx` because outbound package downloads are blocked (HTTP 403 via proxy). Resolved by reading `word/document.xml` with Python's `zipfile` module instead.
- 2025-10-24T22:06:42Z — `pnpm test --run --reporter=dot`, `pnpm lint`, and `pnpm typecheck` failed because no package manifest is present in the repository. Recorded as expected for the static awards site; no action required.
