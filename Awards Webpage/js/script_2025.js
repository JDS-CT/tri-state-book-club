/* Tri-State Book Club — 2025 Awards data (stub)
   Mirrors 2024 structure: defines a global `awards` array.
   Fill `nominations` with display strings (you used <i>…</i> last year), then set `winner` and `runnerUp`. */

const awards = [
  { category: "Best Book", nominations: [ /* "<i>Example Book</i>" */ ], winner: "", runnerUp: "" },
  { category: "Best Character", nominations: [], winner: "", runnerUp: "" },
  { category: "Worst Book", nominations: [], winner: "", runnerUp: "" },
  { category: "Worst Character", nominations: [], winner: "", runnerUp: "" },
  { category: "Best Plot Twist", nominations: [], winner: "", runnerUp: "" },
  { category: "Memorable Use of Imagery", nominations: [], winner: "", runnerUp: "" },
  { category: "Attractive Character", nominations: [], winner: "", runnerUp: "" },
  { category: "Supporting Character", nominations: [], winner: "", runnerUp: "" },
  { category: "Original Concept", nominations: [], winner: "", runnerUp: "" },
  { category: "Most Anticipated Before Reading", nominations: [], winner: "", runnerUp: "" },
  { category: "Most Memorable Book Club Moment", nominations: [], winner: "", runnerUp: "" },
  { category: "Best Book of All Time", nominations: [], winner: "", runnerUp: "" },

  // New for 2025:
  { category: "Vote for book to be re-read this year", nominations: [], winner: "", runnerUp: "" }
];

// Make available to your existing index.html code if it reads from window
window.awards = awards;