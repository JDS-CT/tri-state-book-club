# Ranked Ballot Exchange Format

The awards site and Google Form exports share a normalized JSON payload so ballots can move between tooling without ad-hoc cleanup. Every file should be valid UTF-8 JSON and match the schema outlined below.

## Envelope Structure

```json
{
  "schema": "tri-state-book-club/ranked-choice-ballots",
  "version": 1,
  "year": "2024",
  "generatedAt": "2024-12-31T23:59:59.000Z",
  "source": {
    "type": "google-form",
    "id": "form-123",
    "description": "Post-ceremony survey"
  },
  "ballots": [
    {
      "ballotId": "abc123",
      "voter": {
        "name": "Alex Reader",
        "email": "alex@example.com"
      },
      "rankings": [
        {
          "category": "Best Book",
          "ranking": [
            { "rank": 1, "title": "Mister Magic" },
            { "rank": 2, "title": "The Last Murder at the End of the World" }
          ]
        }
      ],
      "notes": "Great year!",
      "submittedAt": "2024-12-15T19:22:10.000Z"
    }
  ]
}
```

## Field Reference

| Field | Type | Notes |
| --- | --- | --- |
| `schema` | string | Always `tri-state-book-club/ranked-choice-ballots`. Used to guard against mismatched exports. |
| `version` | number | Currently `1`. Increment when the schema changes. |
| `year` | string | Ceremony year the ballots belong to. |
| `generatedAt` | string | ISO 8601 timestamp describing when the file was created. |
| `source` | object | Metadata about where the file came from. Include at least a `type` key (e.g., `website-prototype`, `google-form`). |
| `ballots` | array | Collection of ballot objects. |
| `ballotId` | string | Unique identifier for the ballot. Empty strings are allowed for anonymous prototypes. |
| `voter` | object | Free-form voter metadata. Recommended keys: `name`, `email`. |
| `rankings` | array | One entry per category. Each entry includes a `category` name and a `ranking` array. |
| `ranking` | array | Ordered preferences for the category. Rank numbers must start at `1` and increase without duplicates. |
| `notes` | string | Optional free-text comments from the voter. |
| `submittedAt` | string | Optional ISO 8601 timestamp for the original submission. |

## Import / Export Workflow

1. **Export from Google Forms** into a spreadsheet (CSV).  
2. **Normalize column names** to match category titles exactly and ensure ranked columns include the rank number (for example, `Best Book #1`, `Best Book #2`).  
3. **Convert the rows to JSON** mapping each response to a ballot. Follow the structure above when constructing the `rankings` array.  
4. **Save the JSON file** and drop it into the "Validate an Imported File" panel on the awards site.  
5. **Resolve validation warnings** surfaced by the site before importing the ballots into any downstream tooling.

When exporting directly from the website prototype, the generated payload already adheres to the schema and can be imported without additional processing.
