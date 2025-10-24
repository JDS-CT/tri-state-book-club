# Data Schema Guide

This guide captures the canonical data formats the book club uses when preparing awards. Follow these conventions when setting up a new season so the awards tooling, website, and archives stay aligned.

## Directory conventions

- **Per-year data root:** `years/<year>/`
  - `books/memory-aids/` – One Markdown file per title using the memory-aid template below.
  - `nominations/` – Raw exports (`<year>-raw-submissions.md`) and normalized JSON (`<year>-award-nominations.json`).
  - `voting/` – Ranked results exports once tallies are complete (see ranked results schema).

## Normalized nominations (JSON)

File: `years/<year>/nominations/<year>-award-nominations.json`

```json
{
  "season": 2025,
  "generated_at": "2025-10-15T22:14:00Z",
  "source_form": "2025-ms-forms-nominations",
  "categories": [
    {
      "id": "best-book",
      "label": "Best Book",
      "prompt": "Best Book",
      "nominations": [
        {
          "id": "the-book-of-doors",
          "display_name": "The Book of Doors",
          "aliases": ["Book of Doors"],
          "mentions": [
            {
              "submitter": "Chris",
              "submitted_at": "2025-10-01T02:15:00Z",
              "rank": 1,
              "raw_text": "The Book of Doors"
            }
          ],
          "notes": "Combine duplicates and normalize spelling here."
        }
      ]
    }
  ]
}
```

**Fields**

- `season` *(number, required)* – Club season year.
- `generated_at` *(ISO-8601 string, required)* – When the normalized file was produced.
- `source_form` *(string, optional)* – Human-readable identifier for the intake form or export.
- `categories` *(array, required)* – One entry per ballot category.
  - `id` *(string, required)* – Stable slug (lowercase kebab-case) used by scripts/website.
  - `label` *(string, required)* – Display name shown on the site.
  - `prompt` *(string, optional)* – Original question text if it differs from the label.
  - `nominations` *(array)* – Zero or more normalized nominees.
    - `id` *(string, required)* – Slug for the nominee.
    - `display_name` *(string, required)* – Clean display string for the nominee.
    - `aliases` *(array of strings, optional)* – Alternate spellings captured during cleanup.
    - `mentions` *(array, optional)* – Individual submissions that map to this normalized item.
      - `submitter` *(string)* – Name or identifier of the voter.
      - `submitted_at` *(ISO-8601 string)* – Timestamp from the raw export.
      - `rank` *(number)* – Ranked-choice position (1 = top preference).
      - `raw_text` *(string)* – Exact free-text that was normalized.
    - `notes` *(string, optional)* – Additional cleanup or context for the committee.

## Ranked results (JSON)

File: `years/<year>/voting/<year>-ranked-results.json`

```json
{
  "season": 2025,
  "published_at": "2025-11-18T20:00:00Z",
  "categories": [
    {
      "id": "best-book",
      "label": "Best Book",
      "winner": {
        "id": "the-book-of-doors",
        "display_name": "The Book of Doors",
        "points": 98
      },
      "runner_up": {
        "id": "sunrise-on-the-reaping",
        "display_name": "Sunrise on the Reaping",
        "points": 83
      },
      "rankings": [
        { "position": 1, "id": "the-book-of-doors", "display_name": "The Book of Doors", "points": 98 },
        { "position": 2, "id": "sunrise-on-the-reaping", "display_name": "Sunrise on the Reaping", "points": 83 }
      ],
      "notes": "Include ties, honorable mentions, or methodology notes if needed."
    }
  ]
}
```

**Fields**

- `season` *(number, required)* – Club season year.
- `published_at` *(ISO-8601 string, optional)* – When the reveal went live.
- `categories` *(array, required)* – Ranked results per category.
  - `id` *(string, required)* – Slug that matches the nominations file.
  - `label` *(string, required)* – Display label.
  - `winner` *(object, required)* – Winner metadata.
  - `runner_up` *(object, optional)* – Runner-up metadata (omit if not applicable).
  - `rankings` *(array, required)* – Ordered standings.
    - `position` *(number, required)* – 1-indexed placing.
    - `id` *(string, required)* – Nominee slug.
    - `display_name` *(string, required)* – Rendered name on the reveal.
    - `points` *(number, optional)* – Total points/votes after tally.
    - Additional optional metrics (e.g., `first_place_votes`) can be appended as needed.
  - `notes` *(string, optional)* – Qualitative commentary, tie details, or methodology references.

## Raw submission exports (CSV & JSON)

Store the original responses in `years/<year>/nominations/raw/` or alongside `*-raw-submissions.md`. When exporting data for scripts, use the following column headers/order so merges stay consistent.

### CSV header

```
submission_id,submitter,submitted_at,category_label,rank,nomination_text,additional_context
```

- `submission_id` – Unique row ID from the form provider.
- `submitter` – Name or identifier supplied by the voter.
- `submitted_at` – ISO timestamp from the form.
- `category_label` – Question text exactly as the form presented it.
- `rank` – Ranked-choice order (1 = top pick). Use blank for unranked/free text prompts.
- `nomination_text` – Voter’s raw answer.
- `additional_context` – Free-form notes (optional).

### JSON structure

```json
{
  "season": 2025,
  "exported_at": "2025-10-15T21:00:00Z",
  "submissions": [
    {
      "submission_id": "abc123",
      "submitter": "Chris",
      "submitted_at": "2025-10-01T02:14:00Z",
      "responses": [
        {
          "category_label": "Best Book",
          "rank": 1,
          "nomination_text": "The Book of Doors",
          "additional_context": null
        }
      ]
    }
  ]
}
```

**Fields**

- `season` *(number, required)* – Year the submission belongs to.
- `exported_at` *(ISO-8601 string, required)* – Time the export was produced.
- `submissions` *(array, required)* – One entry per form submission.
  - `submission_id` *(string, required)* – Stable unique ID.
  - `submitter` *(string, optional)* – Name or identifier.
  - `submitted_at` *(ISO-8601 string, optional)* – Timestamp from the form.
  - `responses` *(array, required)* – Individual category answers.
    - `category_label` *(string, required)* – Prompt text.
    - `rank` *(number, optional)* – Ranked-choice placement (omit for open responses).
    - `nomination_text` *(string, required)* – Raw answer.
    - `additional_context` *(string, optional)* – Extra notes or clarifications.

## Memory aid Markdown template

File: `years/<year>/books/memory-aids/<slug>.md`

```markdown
---
title: "Book Title"
author: "Author Name"
club_year: 2025
memory_aid: true
---

## Synopsis
Concise paragraph summarizing the story arc.

## Key Characters
- **Character Name** — One-sentence reminder of who they are or why they matter.
```

**Conventions**

- Use lowercase kebab-case filenames (e.g., `the-book-of-doors.md`).
- Keep synopsis to one or two paragraphs focused on plot triggers.
- List 3–5 key characters in order of importance using bold names and em dash separators.
- Link to this document from each per-year memory-aids README so future editors know where to find the template.

## Change management checklist

When standing up a new season:

1. Duplicate the normalized nominations JSON structure with updated `season`, `generated_at`, and category slugs.
2. Create raw submission exports (CSV and/or JSON) using the standard headers/fields.
3. Place per-book memory aids in `books/memory-aids/` using the template above.
4. Once voting concludes, publish ranked results JSON with `winner`, `runner_up`, and `rankings` populated for each category.
5. Reference this guide from any README files created in the new season’s folders.
