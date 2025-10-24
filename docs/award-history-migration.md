# Award History Migration Workflow

This workflow explains how to migrate legacy `.docx` award history into repository-friendly Markdown and JSON files.

## 1. Inventory Existing Sources
1. List every historical `.docx` artifact and capture high-level metadata (year, author, document purpose).
2. Decide on the destination structure (for example, `YEAR/reading/` for reading notes and `YEAR/nominations/` for ballots).
3. Capture the original file names in the metadata of the converted records for traceability.

## 2. Extract Raw Text
1. Use a text extraction helper to read `word/document.xml` from the `.docx` archive (no external dependencies required).
2. Normalize whitespace (remove double spaces, fix soft line wraps) and preserve deliberate separators (headings, numbered lists).
3. Save the raw dump temporarily so the conversion can be reviewed line-by-line.

## 3. Shape the Content
1. Identify logical sections (e.g., per-book notes or per-award category).
2. Translate prose sections into Markdown headings with bullet lists for supporting details.
3. For structured data (ranked ballots, nominations), map each entry into JSON objects with consistent keys (`name`, `title`, `rank`, `work`, etc.).
4. Carry over any instructions or submission notes from the document into dedicated metadata fields (such as `submission_notes`).

## 4. Write Canonical Files
1. Create the target directory if it does not exist (e.g., `2023/reading/` or `2023/nominations/`).
2. Store narrative summaries as Markdown (`*.md`) and structured ballots as JSON (`*.json`).
3. Include a trailing newline and UTF-8 encoding for all files.

## 5. Verify Fidelity
1. Compare the converted Markdown/JSON with the original `.docx` content to confirm all points and rankings are captured.
2. Flag any ambiguous or missing sections with explicit notes (e.g., "Notes not recorded") so reviewers know where detail was unavailable.
3. Save the script or commands used for extraction alongside the conversion notes when possible.

## 6. Future Automation (Optional)
1. Package the extraction/parsing logic into a reusable Python script for batch conversions.
2. Add tests that feed sample `.docx` files through the script and compare the output with curated fixtures.
3. Document the script in the repository README once it is production ready.
