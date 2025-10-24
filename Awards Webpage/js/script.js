const awards = [
    {
        category: "Best Book",
        nominations: [
          "<i>Mister Magic</i>",
          "<i>The Three-Body Problem Series</i>",
          "<i>Intercepts</i>",
          "<i>The Last Murder at the End of the World</i>"
        ],
        winner: "<i>Mister Magic</i>",
        runnerUp: "<i>The Three-Body Problem Series</i>"
      },
      {
        category: "Best Character",
        nominations: [
          "Val (<i>Mister Magic</i>)",
          "Emory (<i>The Last Murder at the End of the World</i>)",
          "Wallfacer Luo Ji (<i>The Dark Forest</i>)",
          "The Four-Dimensional Tombstone (<i>The Three-Body Problem</i>)",
          "Joe (<i>Intercepts</i>)"
        ],
        winner: "Val (<i>Mister Magic</i>)",
        runnerUp: "Emory (<i>The Last Murder at the End of the World</i>)"
      },
      {
        category: "Worst Book",
        nominations: [
          "<i>Until the End of the World</i>",
          "<i>The Mysterious Case of the Alperton Angels</i>",
          "<i>Intercepts</i>",
          "<i>House of Roots and Ruin</i>"
        ],
        winner: "<i>Until the End of the World</i>",
        runnerUp: "<i>The Mysterious Case of the Alperton Angels</i>"
      },
      {
        category: "Worst Character",
        nominations: [
          "Christopher (<i>The Calling</i>)",
          "Mayor (<i>Mister Magic</i>)",
          "An Lui (<i>The Calling</i>)",
          "Constance (<i>Intercepts</i>)",
          "Oliver Menzies (<i>The Mysterious Case of the Alperton Angels</i>)",
          "Mister Magic (Character)"
        ],
        winner: "Christopher (<i>The Calling</i>)",
        runnerUp: "Mayor (<i>Mister Magic</i>)"
      },
      {
        category: "Best Plot Twist",
        nominations: [
          "<i>Last Murder at the End of the World</i> - The villagers could walk through the fog",
          "<i>Mister Magic</i> - Revelation of the true nature of the children's show",
          "<i>The Calling</i> - Chiocco's unexpected death",
          "<i>The Three-Body Problem Series</i> - Luo Ji's hidden plan",
          "<i>House of Roots and Ruin</i> - Alexander Laurant's betrayal"
        ],
        winner: "<i>Last Murder at the End of the World</i> - The villagers could walk through the fog",
        runnerUp: "<i>Mister Magic</i> - Revelation of the true nature of the children's show"
      },
      {
        category: "Memorable Use of Imagery",
        nominations: [
          "The in-between world of lit candles (<i>Thirteenth Child</i>)",
          "Mirror reflections with Vesper Wright (<i>Black Sheep</i>)",
          "The world-building in Three Body Problem for the VR game (<i>The Three-Body Problem</i>)",
          "Fire and brimstone imagery (<i>Intercepts</i>)",
          "Luo Ji's desert ordeal (<i>The Three-Body Problem</i>)"
        ],
        winner: "The in-between world of lit candles (<i>Thirteenth Child</i>)",
        runnerUp: "Mirror reflections with Vesper Wright (<i>Black Sheep</i>)"
      },
      {
        category: "Attractive Character",
        nominations: [
          "Aa (<i>Death's End</i>)",
          "Alexander's Triplets (<i>House of Roots and Ruin</i>)",
          "Isaac (<i>Mister Magic</i>)",
          "Prince Leopold (<i>Thirteenth Child</i>)",
          "Maccabee (<i>The Calling</i>)"
        ],
        winner: "Aa (<i>Death's End</i>)",
        runnerUp: "Alexander's Triplets (<i>House of Roots and Ruin</i>)"
      },
      {
        category: "Supporting Character",
        nominations: [
          "Benji the Gay Cowboy (<i>Until the End of the World</i>)",
          "Aa (<i>Death's End</i>)",
          "The Divided Ones (<i>Thirteenth Child</i>)",
          "Alexander Laurant (<i>House of Roots and Ruin</i>)",
          "Hilal (<i>The Calling</i>)"
        ],
        winner: "Benji the Gay Cowboy (<i>Until the End of the World</i>)",
        runnerUp: "Aa (<i>Death's End</i>)"
      },
      {
        category: "Original Concept",
        nominations: [
          "<i>Three Body Problem Series</i>",
          "<i>Intercepts</i>",
          "<i>The Last Murder at the End of the World</i>",
          "<i>Mister Magic</i>"
        ],
        winner: "<i>Three Body Problem Series</i>",
        runnerUp: "<i>Intercepts</i>"
      },
      {
        category: "Most Anticipated Before Reading",
        nominations: [
          "<i>The Last Murder at the End of the World</i>",
          "<i>The Three-Body Problem</i>",
          "<i>House of Roots and Ruin</i>"
        ],
        winner: "<i>The Last Murder at the End of the World</i>",
        runnerUp: "<i>The Three-Body Problem</i>"
      },
      {
        category: "Most Memorable Book Club Moment",
        nominations: [
          "Sylvia's Miniature Houses",
          "Creating Images with GPT for Laughter",
          "Ivy Finally Cat-Free",
          "Smith's Declaration of Hatred",
          "Losing the Election",
          "The Virtual Reality Meeting"
        ],
        winner: "Sylvia's Miniature Houses",
        runnerUp: "Creating Images with GPT for Laughter"
      },
      {
        category: "Best Book of All Time",
        nominations: [
          "<i>The Library at Mount Char</i>",
          "<i>The 7½ Deaths of Evelyn Hardcastle</i>",
          "<i>Abhorsen</i>",
          "<i>The Starless Sea</i>"
        ],
        winner: "<i>The Library at Mount Char</i>",
        runnerUp: "<i>The 7½ Deaths of Evelyn Hardcastle</i>"
      }
    ];
  
  let currentIndex = 0;
  
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
  }
  
  function revealNext() {
    if (currentIndex < awards.length) {
      const contentDiv = document.getElementById('content');
      contentDiv.innerHTML = '';
      const revealButton = document.getElementById('revealButton');
      revealButton.disabled = true;
  
      const award = awards[currentIndex];
  
      // Display Category
      const categoryDiv = document.createElement('div');
      categoryDiv.id = 'category';
      categoryDiv.innerHTML = award.category;
      contentDiv.appendChild(categoryDiv);
      categoryDiv.style.opacity = '1';
  
      // Shuffle nominations
      const shuffledNominations = [...award.nominations];
      shuffle(shuffledNominations);
  
      // Wait before showing nominations
      setTimeout(() => {
        // Display Nominations
        const nominationDivs = [];
  
        shuffledNominations.forEach((nomination, index) => {
          const nomDiv = document.createElement('div');
          nomDiv.className = 'nomination';
          nomDiv.innerHTML = nomination;
          
          // Random z-index
          nomDiv.style.zIndex = index;
  
          // Random initial position offsets
          nomDiv.style.setProperty('--offsetX', `${Math.random() * 20 - 10}px`);
          nomDiv.style.setProperty('--offsetY', `${Math.random() * 20 - 10}px`);
  
          // Random explosion direction
          nomDiv.style.setProperty('--x', `${Math.random() * 200 - 100}%`);
          nomDiv.style.setProperty('--y', `${Math.random() * 200 - 100}%`);
  
          contentDiv.appendChild(nomDiv);
          setTimeout(() => {
            nomDiv.style.transform = 'translate(-50%, -50%) scale(1)';
            nomDiv.style.opacity = '1';
          }, index * 100);
  
          nominationDivs.push(nomDiv);
        });
  
        const totalNominationDisplayTime = (shuffledNominations.length - 1) * 100 + 500;
  
        // After all nominations have appeared, start explosion
        setTimeout(() => {
          // Play the explosion sound
          const explosionSound = document.getElementById('explosionSound');
          explosionSound.play();
  
          // Add 'explode' class to all nominations
          nominationDivs.forEach(nomDiv => {
            nomDiv.classList.add('explode');
          });
        }, totalNominationDisplayTime);
  
        // Wait for explosion effect to complete
        setTimeout(() => {
          // Flicker between winner and runner-up
          const winnerDiv = document.createElement('div');
          winnerDiv.id = 'winner';
          contentDiv.appendChild(winnerDiv);
  
          // Play the winner sound
          const winnerSound = document.getElementById('winnerSound');
          winnerSound.play();
  
          let flickerCount = 0;
          const maxFlickers = 50; // Flicker for 5 seconds (50 * 100ms)
          const flickerInterval = setInterval(() => {
            winnerDiv.style.opacity = '0';
            setTimeout(() => {
              winnerDiv.innerHTML = flickerCount % 2 === 0 ? award.winner : award.runnerUp;
              winnerDiv.style.opacity = '1';
            }, 100);
            flickerCount++;
            if (flickerCount >= maxFlickers) {
              clearInterval(flickerInterval);
              // Final reveal
              setTimeout(() => {
                winnerDiv.style.opacity = '0';
                setTimeout(() => {
                  winnerDiv.innerHTML = award.winner;
                  winnerDiv.style.opacity = '1';
                  revealButton.disabled = false;
  
                  currentIndex++;
                  if (currentIndex === awards.length) {
                    revealButton.innerText = 'Ceremony Concluded';
                    revealButton.disabled = true;
                    revealButton.style.backgroundColor = '#555';
                    revealButton.style.cursor = 'default';
                  }
                }, 100);
              }, 1000);
            }
          }, 100);
        }, totalNominationDisplayTime + 2000); // Wait for explosion effect to complete
  
      }, 2000); // Wait before showing nominations
    }
  }
  