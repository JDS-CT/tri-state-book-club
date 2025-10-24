# Annual Awards Workflow

This workflow documents the recurring steps the Tri-State Book Club follows for each awards season. It references canonical artifacts captured under `years/<year>/` so future committees can trace every action from nomination kickoff through post-event archiving.

## 1. Collecting Nominations

1. **Configure the form.** Start with the current Microsoft Forms question set in [`years/2025/forms/2025-forms-questions.md`](../../years/2025/forms/2025-forms-questions.md). Duplicate the questions into a new form for the upcoming season, updating category labels or adding prompts noted in the prior year’s retrospectives. Historical context for earlier seasons lives in [`years/2024/forms/README.md`](../../years/2024/forms/README.md) and [`years/2023/forms/README.md`](../../years/2023/forms/README.md).
2. **Distribute the link.** Share the form with club members and set an announced close date. Capture reminder copy inside the year’s `nominations/README.md` (for example, [`years/2025/nominations/README.md`](../../years/2025/nominations/README.md)) so the communication trail is archived with the responses.
3. **Export submissions.** At closing, export the raw responses to Markdown or JSON. Save them alongside any ad-hoc exports such as Excel files: see [`years/2025/nominations/2025-raw-submissions.md`](../../years/2025/nominations/2025-raw-submissions.md) for a consolidated transcript and [`years/2024/nominations/2024-awards.xlsx`](../../years/2024/nominations/2024-awards.xlsx) for last year’s spreadsheet download.

**Tooling notes:** Exports can come from Microsoft Forms (Excel) or Google Forms (CSV). If the platform changes, record instructions in the season’s `forms/README.md` so the workflow stays reproducible.

## 2. Cleaning and Normalizing Data

1. **Normalize naming.** Use a spreadsheet or Python script to align spelling and capitalization before aggregation. The cleaned nomination manifests for 2024 and 2025 live in [`years/2024/nominations/2024-award-nominations.json`](../../years/2024/nominations/2024-award-nominations.json) and [`years/2025/nominations/2025-award-nominations.json`](../../years/2025/nominations/2025-award-nominations.json).
2. **Capture transformation notes.** Document any manual edits in the same directory—e.g., annotate JSON comments in the README or append a changelog block inside [`years/2024/nominations/README.md`](../../years/2024/nominations/README.md).

**Tooling notes:** Today, normalization typically happens in Excel or LibreOffice. Consider porting repeated cleanup steps (deduping, trimming whitespace, mapping alternate titles) into a reusable Python helper (see **Automation Opportunities** below).

## 3. Aggregating Votes

1. **Tally results.** After the final ballot, aggregate ranked or plurality votes. Store the output under the season’s `voting/` folder. For example, the 2023 vote tally script references [`years/2023/voting/README.md`](../../years/2023/voting/README.md), while 2024/2025 seasons link directly to their JSON data sources from the reveal pages.
2. **Sync reveal data.** Update the awards data consumed by the reveal webpage. The canonical JSON that powers the slideshow is stored in [`years/2023/reveal/awards.json`](../../years/2023/reveal/awards.json), [`years/2024/reveal/awards.json`](../../years/2024/reveal/awards.json), and [`years/2025/reveal/awards.json`](../../years/2025/reveal/awards.json).

**Tooling notes:** Use pivot tables or the existing ranked-choice tally spreadsheet as needed. For automation, we plan to host Python scripts (e.g., vote counters, sanity checks) in `tools/helpers/` so they can ingest raw submissions and emit the normalized JSON automatically.

## 4. Preparing Reveals

1. **Draft the run-of-show.** Track talking points and stage directions within `reveal/notes/`. Each season keeps placeholders—see [`years/2024/reveal/notes/`](../../years/2024/reveal/notes/) and [`years/2025/reveal/notes/`](../../years/2025/reveal/notes/).
2. **Stage multimedia.** Store slides, audio cues, and scripts in the corresponding subfolders. The 2024 HTML reveal script lives in [`years/2024/reveal/2024 Awards.html`](../../years/2024/reveal/2024%20Awards.html), while the JSON-driven flow for 2023–2025 is captured via the `awards.json` files noted above.
3. **Verify the webpage.** Ensure the public site loads the latest dataset (`Awards Webpage/js/script_2025.js`) and that the JSON referenced under `years/<year>/reveal/` matches the deployed script.

**Tooling notes:** Slides can be composed in PowerPoint/Keynote and exported to PDF. Keep editable originals in the `slides/` folder and note software requirements in the season README.

## 5. Archiving Artifacts

1. **Finalize directory structure.** Move all season-specific assets—forms, raw exports, normalized data, reveal decks—under the appropriate `years/<year>/` subdirectories. Use the 2023 archive in [`years/2023/`](../../years/2023/) as the reference layout.
2. **Record lessons learned.** Append takeaways to the season README (e.g., [`years/2025/README.md`](../../years/2025/README.md)) and update cross-year indices such as [`years/memory-aids-index.json`](../../years/memory-aids-index.json) when new references appear.
3. **Back up media.** Confirm that audio, slide exports, and scripts have been synced to cloud storage or shared drives. Document the storage location inside `reveal/README.md` (for example, [`years/2024/reveal/README.md`](../../years/2024/reveal/README.md)).

**Tooling notes:** Archive binaries in their native formats but consider generating lightweight Markdown summaries or JSON manifests for quick diffing in Git.

## Automation Opportunities

- **Helper scripts repository.** Stand up a `tools/helpers/` directory for repeatable Python utilities—one for parsing raw submissions into the normalized JSON schema, another for tallying ranked-choice votes, and a validator that cross-checks reveal data before publishing.
- **Spreadsheet templates.** Store canonical Excel templates (like the 2024 export) under `nominations/` so we can automate conversions via `openpyxl` or `pandas` in future seasons.

## Seasonal Maintenance

- Review this document at the start and end of every awards cycle. Incorporate new lessons, file paths, or tooling changes immediately so the workflow stays accurate.
- When processes change mid-season, update both this guide and the affected `years/<year>/` README files so future volunteers can trace the exact flow used that year.

