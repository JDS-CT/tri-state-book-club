# Awards Site Navigation Blueprint

This blueprint enumerates the high-level views that the refreshed awards webpage should support. Each view is mapped to a tab in the navigation bar so ceremony hosts can jump between the reveal experience and the supporting data tools without reloading the page.

## Views

1. **Awards Reveal**  
   *Purpose:* Preserve the dramatic ceremony reveal sequence.  
   *Key UI elements:* Category spotlight, animated nomination cards, reveal button, audio cues.  
   *Data dependencies:* Full awards dataset with nominations, winner, and runner-up fields.  
   *Notes:* This view must remain keyboard accessible and resilient if audio fails to load.

2. **Nominations Overview**  
   *Purpose:* Provide a quick reference of every nomination in each category.  
   *Key UI elements:* Scrollable list grouped by category with nomination counts and raw HTML preserved for emphasis tags.  
   *Data dependencies:* Awards dataset; gracefully handle empty nominations arrays.

3. **Winners & Finalists**  
   *Purpose:* Offer a printable summary of winners and runner-ups for the year.  
   *Key UI elements:* Table-style list showing category, winner, runner-up, with fallback text when data is incomplete.  
   *Data dependencies:* Awards dataset.

4. **Data Exchange**  
   *Purpose:* Document the ranked ballot JSON exchange format and preview imports.  
   *Key UI elements:* Read-only JSON sample, file import control, validation summary.  
   *Data dependencies:* Voting format helpers; optional awards data to seed category names.

5. **Ranked Voting Prototype**  
   *Purpose:* Collect ranked preferences directly on the site and export them in the standard format.  
   *Key UI elements:* Voter detail inputs, per-category ranked selectors, JSON export area.  
   *Data dependencies:* Awards dataset for category names and nominations; voting format helpers.

## Interaction Flow

* Tabs switch the active view without reloading the page.  
* Loading a ceremony year refreshes all views so navigation always reflects the selected dataset.  
* Data Exchange and Ranked Voting views use the shared voting format helpers to ensure exported payloads match the documented schema.
