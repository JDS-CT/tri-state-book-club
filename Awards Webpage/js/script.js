let awards = [];
let currentIndex = 0;
let activeYear = '';
let ceremonyTitle = '';

function setStatusMessage(text, isError = false) {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = '';
  const status = document.createElement('div');
  status.className = `status-message${isError ? ' status-error' : ''}`;
  status.textContent = text;
  contentDiv.appendChild(status);
}

function updateSubtitle() {
  const subtitle = document.getElementById('ceremonySubtitle');
  const label = ceremonyTitle || (activeYear ? `Book Club Awards ${activeYear}` : '');
  subtitle.textContent = label;
}

async function loadYearData(year) {
  const revealButton = document.getElementById('revealButton');
  revealButton.disabled = true;
  revealButton.textContent = 'Loading…';
  revealButton.style.backgroundColor = '#555';
  revealButton.style.cursor = 'default';
  setStatusMessage('Loading awards, please stand by.');

  try {
    const payload = await AwardsLoader.loadAwardsData({ year });
    awards = payload.categories;
    activeYear = payload.year || year;
    ceremonyTitle = payload.title || '';
    currentIndex = 0;

    updateSubtitle();

    if (!awards.length) {
      setStatusMessage('No awards have been recorded for this year yet.');
      revealButton.textContent = 'No Awards Available';
      revealButton.style.backgroundColor = '#555';
      revealButton.style.cursor = 'default';
      return;
    }

    setStatusMessage('Ready when you are—press the button to start the reveal!');
    revealButton.disabled = false;
    revealButton.style.backgroundColor = '#ffcc00';
    revealButton.style.cursor = 'pointer';
    revealButton.textContent = 'Reveal the Winner';
  } catch (error) {
    console.error(error);
    setStatusMessage('Unable to load awards data. Please try again later.', true);
    revealButton.textContent = 'Load Failed';
    revealButton.style.backgroundColor = '#555';
    revealButton.style.cursor = 'default';
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function revealNext() {
  if (currentIndex >= awards.length) {
    return;
  }

  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = '';
  const revealButton = document.getElementById('revealButton');
  revealButton.disabled = true;

  const award = awards[currentIndex];

  const categoryDiv = document.createElement('div');
  categoryDiv.id = 'category';
  categoryDiv.innerHTML = award.category;
  contentDiv.appendChild(categoryDiv);
  categoryDiv.style.opacity = '1';

  const shuffledNominations = [...award.nominations];
  shuffle(shuffledNominations);

  const nominationDivs = [];

  setTimeout(() => {
    shuffledNominations.forEach((nomination, index) => {
      const nomDiv = document.createElement('div');
      nomDiv.className = 'nomination';
      nomDiv.innerHTML = nomination;
      nomDiv.style.zIndex = index;
      nomDiv.style.setProperty('--offsetX', `${Math.random() * 20 - 10}px`);
      nomDiv.style.setProperty('--offsetY', `${Math.random() * 20 - 10}px`);
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

    setTimeout(() => {
      const explosionSound = document.getElementById('explosionSound');
      if (explosionSound) {
        explosionSound.currentTime = 0;
        explosionSound.play().catch(() => {});
      }

      nominationDivs.forEach(nomDiv => {
        nomDiv.classList.add('explode');
      });
    }, totalNominationDisplayTime);

    setTimeout(() => {
      const winnerDiv = document.createElement('div');
      winnerDiv.id = 'winner';
      contentDiv.appendChild(winnerDiv);

      const winnerSound = document.getElementById('winnerSound');
      if (winnerSound) {
        winnerSound.currentTime = 0;
        winnerSound.play().catch(() => {});
      }

      let flickerCount = 0;
      const maxFlickers = 50;
      const flickerInterval = setInterval(() => {
        winnerDiv.style.opacity = '0';
        setTimeout(() => {
          winnerDiv.innerHTML = flickerCount % 2 === 0 ? award.winner : award.runnerUp;
          winnerDiv.style.opacity = '1';
        }, 100);
        flickerCount++;
        if (flickerCount >= maxFlickers) {
          clearInterval(flickerInterval);
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
    }, totalNominationDisplayTime + 2000);
  }, 2000);
}

window.addEventListener('DOMContentLoaded', () => {
  const yearSelect = document.getElementById('yearSelect');
  if (!yearSelect) {
    throw new Error('Year selector missing from the page.');
  }

  yearSelect.addEventListener('change', event => {
    const year = event.target.value;
    loadYearData(year);
  });

  loadYearData(yearSelect.value);
});
