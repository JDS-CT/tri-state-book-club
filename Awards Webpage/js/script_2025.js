/* Tri-State Book Club — 2025 Awards data (stub)
   Mirrors 2024 structure: defines a global `awards` array.
   Fill `nominations` with display strings (you used <i>…</i> last year), then set `winner` and `runnerUp`. */

const awards = [
  {
    category: "Best Book",
    nominations: [
      "<i>Briardark</i>",
      "<i>Mickey7</i>",
      "<i>Sunrise on the Reaping</i>",
      "<i>The Book of Doors</i>"
    ],
    winner: "",
    runnerUp: ""
  },
  {
    category: "Best Character",
    nominations: [
      "Cassie Andrews",
      "Haymitch Abernathy",
      "Izzy (The Unmaking of June Farrow)",
      "Mickey Barnes"
    ],
    winner: "",
    runnerUp: ""
  },
  {
    category: "Worst Book",
    nominations: [
      "<i>Mickey7</i>",
      "<i>Pines</i>",
      "<i>TOTO</i>",
      "<i>The Witchstone</i>"
    ],
    winner: "",
    runnerUp: ""
  },
  {
    category: "Worst Character",
    nominations: [
      "Adorane (The Threat Below)",
      "Emmit (Briardark)",
      "Ethan Burke",
      "Icelyn (The Threat Below)",
      "The Woman (The Book of Doors)"
    ],
    winner: "",
    runnerUp: ""
  },
  {
    category: "Best Plot Twist",
    nominations: [
      "Annie is the family friend from June's granny",
      "Cassie links the Society of Unknowable Objects to the Book of Doors",
      "The old man never used the book to travel",
      "The Woman is corrupted by Hugo Barbery"
    ],
    winner: "",
    runnerUp: ""
  },
  {
    category: "Memorable Use of Imagery",
    nominations: [
      "Running from the Threat Below in the forest",
      "The Book of Doors — Living tomes and time slips",
      "The Unmaking of June Farrow — Vivid but unspecified scene"
    ],
    winner: "",
    runnerUp: ""
  },
  {
    category: "Attractive Character",
    nominations: [
      "Adorane (The Threat Below)",
      "Drummond Fox",
      "Eamon Stone (The Unmaking of June Farrow)",
      "Izzy (The Unmaking of June Farrow)",
      "James (The Society of Unknowable Objects)",
      "Toto (TOTO)"
    ],
    winner: "",
    runnerUp: ""
  },
  {
    category: "Supporting Character",
    nominations: [
      "Berto Gomez",
      "Eveshone (The Threat Below)",
      "Maysilee Donner",
      "Min",
      "The Woman (The Book of Doors)"
    ],
    winner: "",
    runnerUp: ""
  },
  {
    category: "Original Concept",
    nominations: [
      "<i>Briardark</i>",
      "<i>Dreadful</i>",
      "<i>The Book of Doors</i>",
      "<i>The Threat Below</i>",
      "<i>The Witchstone</i>"
    ],
    winner: "",
    runnerUp: ""
  },
  {
    category: "Most Anticipated Before Reading",
    nominations: [
      "<i>Briardark</i>",
      "<i>Dreadful</i>",
      "<i>Sunrise on the Reaping</i>",
      "<i>TOTO</i>"
    ],
    winner: "",
    runnerUp: ""
  },
  {
    category: "Most Memorable Book Club Moment",
    nominations: [
      "Greeting the house ghost each day",
      "Karaoke night",
      "Pitching an AI notetaker using the awards format"
    ],
    winner: "",
    runnerUp: ""
  },
  {
    category: "Best Book of All Time",
    nominations: [
      "<i>Abhorsen</i>",
      "<i>The Starless Sea</i>",
      "<i>The Three-Body Problem</i>"
    ],
    winner: "",
    runnerUp: ""
  },

  // New for 2025:
  {
    category: "Vote for book to be re-read this year",
    nominations: [
      "<i>Jane, Unlimited</i>",
      "<i>Sabriel</i>",
      "<i>Small Favors</i>",
      "<i>The 7½ Deaths of Evelyn Hardcastle</i>",
      "<i>The Continent</i>",
      "<i>The Night Circus</i>"
    ],
    winner: "",
    runnerUp: ""
  }
];

// Make available to your existing index.html code if it reads from window
window.awards = awards;