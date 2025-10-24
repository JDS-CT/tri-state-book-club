# Awards Reveal Workflow

The annual ceremony now reads winners directly from JSON files stored in `years/<year>/reveal/`. Follow this checklist when prepping a new season (or backfilling an older one):

1. **Finalize the winners and runners-up.**
   - Confirm each category name, nominee list, and the two finalists you want to display.
   - Keep any inline HTML formatting (e.g., `<i>Title</i>`) that should appear during the reveal.

2. **Export the structured data.**
   - Copy `years/2024/reveal/awards.json` as a template.
   - Update the `year`, `title`, and each entry inside `categories` for the new season.
   - Save the finished JSON as `years/<year>/reveal/awards.json`.

3. **Archive presentation assets.**
   - Drop the HTML snapshot or slide deck used during the ceremony beside `awards.json`.
   - Place supporting files in subfolders: `audio/` for stingers, `slides/` for decks, and `notes/` for cue sheets.

4. **Wire the data into the live site.**
   - Edit `Awards Webpage/index.html` and add the new year to the `<select id="yearSelect">` options so the operator can pick it on show night.
   - The front-end loader (`Awards Webpage/js/script.js`) automatically pulls the correct JSON via `AwardsLoader.loadAwardsData`, so no additional JavaScript changes are required unless the schema evolves.

5. **Test the reveal.**
   - Run `node --test tests/awards-loader.test.js` to confirm the loader still parses the JSON format.
   - Open `Awards Webpage/index.html` in a browser, choose the new year, and dry-run the reveal sequence.

Keeping each season's assets together under `years/<year>/reveal/` makes it easy to replay the ceremony, regenerate graphics, or audit historical winners without scraping old chats.
