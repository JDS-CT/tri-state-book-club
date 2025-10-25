# 2025 Season Structure

- [`books/`](books/) – Current reading log and discussion aids for 2025 selections.
- [`nominations/`](nominations/) – Raw submissions and consolidated nomination exports.
- [`voting/`](voting/) – Ranked-choice results, tallies, and reveal prep (link to web scripts).
- [`forms/`](forms/) – Questionnaires, automation notes, and form history for 2025.

## Canonical nominations workflow

- `nominations/2025-award-nominations.json` is the single source of truth for all
  2025 category nominations. It includes every normalized nominee, supporting
  alias, and submission provenance.
- `../canonical-nominations.json` maps each ceremony year to its canonical
  nomination file and format. The awards web app reads this manifest at runtime
  and derives presentation strings directly from the JSON.
- Update the manifest whenever a future season adds or relocates its canonical
  nominations file. Do **not** copy nominations into the web scripts—`awardsLoader`
  now loads them from the manifest and formats them on demand.

## Verifying the loader pipeline

- Run `node scripts/generate-embedded-awards-data.js` after editing any canonical
  nomination file. This regenerates the runtime fallback snapshot that keeps the
  static site working when browsers block cross-file requests.
- Execute `node --test tests/awards-loader.test.js` to confirm the loader can
  resolve the manifest, transform the canonical payload, and fall back to the
  embedded snapshot when offline.
- When debugging a stuck "Loading awards" state, open the diagnostics tab in the
  web app and copy the log. Look for `manifest:*` entries to verify the manifest
  resolved, then `load:embedded-success` to confirm the fallback snapshot
  activated if network fetches fail.
