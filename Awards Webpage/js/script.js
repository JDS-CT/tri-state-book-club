let awards = [];
let currentIndex = 0;
let activeYear = '';
let ceremonyTitle = '';
let currentView = 'reveal';

const viewSections = {};
const tabButtons = {};
const MAX_RANK_OPTIONS = 3;
let exchangeImportInitialized = false;
let votingFormInitialized = false;

const viewRenderers = {
  reveal: () => {},
  nominations: renderNominationsView,
  winners: renderWinnersView,
  data: renderDataExchangeView,
  voting: renderVotingPrototypeView
};

function setStatusMessage(text, isError = false) {
  const contentDiv = document.getElementById('content');
  if (!contentDiv) {
    return;
  }
  contentDiv.innerHTML = '';
  const status = document.createElement('div');
  status.className = `status-message${isError ? ' status-error' : ''}`;
  status.textContent = text;
  contentDiv.appendChild(status);
}

function updateSubtitle() {
  const subtitle = document.getElementById('ceremonySubtitle');
  const label = ceremonyTitle || (activeYear ? `Book Club Awards ${activeYear}` : '');
  if (subtitle) {
    subtitle.textContent = label;
  }
}

function toPlainText(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function getCategoryNames() {
  return awards.map(entry => entry.category);
}

function showView(viewId) {
  if (!viewSections[viewId]) {
    return;
  }

  Object.keys(viewSections).forEach(id => {
    const section = viewSections[id];
    const button = tabButtons[id];
    const isActive = id === viewId;

    section.classList.toggle('view-active', isActive);
    section.hidden = !isActive;

    if (button) {
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    }
  });

  currentView = viewId;
  refreshView(viewId);
}

function refreshView(viewId) {
  const renderer = viewRenderers[viewId];
  if (typeof renderer === 'function') {
    renderer();
  }
}

function refreshAllViews() {
  Object.keys(viewRenderers).forEach(refreshView);
}

function renderNominationsView() {
  const container = document.getElementById('nominationsContainer');
  if (!container) {
    return;
  }

  if (!awards.length) {
    container.innerHTML = '<p class="status-message">Select a year to load nominations.</p>';
    return;
  }

  container.innerHTML = '';

  awards.forEach(award => {
    const block = document.createElement('article');
    block.className = 'nominations-block';

    const heading = document.createElement('h3');
    heading.textContent = award.category;
    block.appendChild(heading);

    if (award.nominations && award.nominations.length) {
      const list = document.createElement('ol');
      list.className = 'nominations-list';
      award.nominations.forEach(nomination => {
        const item = document.createElement('li');
        item.innerHTML = nomination;
        list.appendChild(item);
      });
      block.appendChild(list);
    } else {
      const empty = document.createElement('p');
      empty.className = 'empty-message';
      empty.textContent = 'No nominations recorded yet.';
      block.appendChild(empty);
    }

    container.appendChild(block);
  });
}

function renderWinnersView() {
  const container = document.getElementById('winnersContainer');
  if (!container) {
    return;
  }

  if (!awards.length) {
    container.innerHTML = '<p class="status-message">Select a year to review winners.</p>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'winners-table';

  const headerRow = document.createElement('tr');
  ['Category', 'Winner', 'Runner-Up'].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  awards.forEach(award => {
    const row = document.createElement('tr');

    const categoryCell = document.createElement('td');
    categoryCell.textContent = award.category;
    row.appendChild(categoryCell);

    const winnerCell = document.createElement('td');
    winnerCell.innerHTML = award.winner || '<span class="empty-message">Winner TBD</span>';
    row.appendChild(winnerCell);

    const runnerCell = document.createElement('td');
    runnerCell.innerHTML = award.runnerUp || '<span class="empty-message">Runner-up TBD</span>';
    row.appendChild(runnerCell);

    table.appendChild(row);
  });

  container.innerHTML = '';
  container.appendChild(table);
}

function buildSampleExchangePayload() {
  const categories = getCategoryNames();
  const sampleBallot = (typeof VotingFormat !== 'undefined')
    ? VotingFormat.createEmptyBallot({ categories, voterFields: ['name', 'email'] })
    : { ballotId: '', voter: { name: '', email: '' }, rankings: [], notes: '' };

  sampleBallot.ballotId = 'sample-ballot';
  if (sampleBallot.voter) {
    sampleBallot.voter.name = 'Example Voter';
    sampleBallot.voter.email = 'reader@example.com';
  }

  if (sampleBallot.rankings) {
    sampleBallot.rankings.forEach((entry, index) => {
      const nominations = awards[index]?.nominations || [];
      entry.ranking = nominations.slice(0, MAX_RANK_OPTIONS).map((nomination, rankIndex) => ({
        rank: rankIndex + 1,
        title: toPlainText(nomination)
      }));
    });
  }

  if (typeof VotingFormat !== 'undefined') {
    const envelope = VotingFormat.buildExchangeEnvelope({
      year: activeYear || '',
      ballots: [sampleBallot],
      source: { type: 'website-prototype', location: 'Awards Webpage' }
    });
    return JSON.stringify(envelope, null, 2);
  }

  return JSON.stringify(sampleBallot, null, 2);
}

function initializeExchangeImport() {
  if (exchangeImportInitialized) {
    return;
  }

  const input = document.getElementById('exchangeFileInput');
  const summary = document.getElementById('exchangeSummary');
  if (!input || !summary) {
    return;
  }

  input.addEventListener('change', event => {
    summary.classList.remove('error');
    const file = event.target.files && event.target.files[0];
    if (!file) {
      summary.textContent = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof VotingFormat === 'undefined') {
          throw new Error('Voting format helpers are not available in this environment.');
        }
        const payload = VotingFormat.parseExchange(reader.result);
        const ballotCount = payload.ballots.length;
        const categoryCount = payload.ballots[0]?.rankings?.length || 0;
        summary.textContent = `Loaded ${ballotCount} ballot${ballotCount === 1 ? '' : 's'} covering ${categoryCount} categories for ${payload.year || 'an unspecified year'}.`;
      } catch (error) {
        summary.textContent = `File validation failed: ${error.message}`;
        summary.classList.add('error');
      }
    };

    reader.onerror = () => {
      summary.textContent = 'Unable to read the selected file.';
      summary.classList.add('error');
    };

    reader.readAsText(file);
  });

  exchangeImportInitialized = true;
}

function renderDataExchangeView() {
  const spec = document.getElementById('exchangeSpec');
  if (spec) {
    spec.textContent = buildSampleExchangePayload();
  }

  const summary = document.getElementById('exchangeSummary');
  if (summary && !summary.classList.contains('error')) {
    summary.textContent = '';
  }

  initializeExchangeImport();
}

function createRankingSelect({ index, rank, nominations }) {
  const wrapper = document.createElement('div');
  const label = document.createElement('label');
  const select = document.createElement('select');

  const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
  const fieldName = `category-${index}-rank-${rank}`;

  label.textContent = `${rank}${suffix} Choice`;
  label.setAttribute('for', fieldName);

  select.name = fieldName;
  select.id = fieldName;

  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = 'No selection';
  select.appendChild(emptyOption);

  nominations.forEach(nomination => {
    const option = document.createElement('option');
    option.value = toPlainText(nomination);
    option.innerHTML = nomination;
    select.appendChild(option);
  });

  wrapper.appendChild(label);
  wrapper.appendChild(select);
  return wrapper;
}

function generateBallotJson() {
  if (typeof VotingFormat === 'undefined') {
    return;
  }

  const form = document.getElementById('votingForm');
  const output = document.getElementById('ballotOutput');
  if (!form || !output) {
    return;
  }

  const formData = new FormData(form);
  const categories = getCategoryNames();
  const ballot = VotingFormat.createEmptyBallot({ categories, voterFields: ['name', 'email'] });
  ballot.ballotId = `ballot-${Date.now()}`;
  ballot.voter.name = (formData.get('voterName') || '').toString().trim();
  ballot.voter.email = (formData.get('voterEmail') || '').toString().trim();

  ballot.rankings.forEach((entry, index) => {
    const seen = new Set();
    const picks = [];
    for (let rank = 1; rank <= MAX_RANK_OPTIONS; rank += 1) {
      const key = `category-${index}-rank-${rank}`;
      const value = formData.get(key);
      if (typeof value === 'string') {
        const cleaned = value.trim();
        if (cleaned && !seen.has(cleaned)) {
          seen.add(cleaned);
          picks.push({ rank, title: cleaned });
        }
      }
    }
    entry.ranking = picks;
  });

  const envelope = VotingFormat.buildExchangeEnvelope({
    year: activeYear || '',
    ballots: [ballot],
    source: { type: 'website-prototype', location: window.location.pathname }
  });

  output.textContent = JSON.stringify(envelope, null, 2);
}

function initializeVotingForm() {
  if (votingFormInitialized) {
    return;
  }

  const generateButton = document.getElementById('generateBallot');
  if (generateButton) {
    generateButton.addEventListener('click', generateBallotJson);
  }

  votingFormInitialized = true;
}

function renderVotingPrototypeView() {
  const container = document.getElementById('votingCategories');
  const output = document.getElementById('ballotOutput');
  if (!container || !output) {
    return;
  }

  initializeVotingForm();

  if (!awards.length) {
    container.innerHTML = '<p class="status-message">Select a year to configure the ranked ballot form.</p>';
    output.textContent = 'Select a year and fill out the form to generate a ballot.';
    return;
  }

  container.innerHTML = '';

  awards.forEach((award, index) => {
    const block = document.createElement('section');
    block.className = 'ballot-category';

    const heading = document.createElement('h3');
    heading.textContent = award.category;
    block.appendChild(heading);

    const helper = document.createElement('p');
    helper.className = 'view-subtitle';
    helper.textContent = 'Rank up to three titles. Duplicate selections are filtered automatically.';
    block.appendChild(helper);

    const inputs = document.createElement('div');
    inputs.className = 'ranking-inputs';

    for (let rank = 1; rank <= MAX_RANK_OPTIONS; rank += 1) {
      inputs.appendChild(createRankingSelect({ index, rank, nominations: award.nominations || [] }));
    }

    block.appendChild(inputs);
    container.appendChild(block);
  });

  output.textContent = 'Fill out the form and click "Generate Ranked Ballot JSON" to preview the payload.';
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
  if (!contentDiv) {
    return;
  }
  contentDiv.innerHTML = '';
  const revealButton = document.getElementById('revealButton');
  if (revealButton) {
    revealButton.disabled = true;
  }

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
              if (revealButton) {
                revealButton.disabled = false;
              }

              currentIndex++;
              if (revealButton && currentIndex === awards.length) {
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

async function loadYearData(year) {
  const revealButton = document.getElementById('revealButton');
  if (!revealButton) {
    throw new Error('Reveal button missing from the page.');
  }

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
    refreshAllViews();

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
    awards = [];
    refreshAllViews();
    setStatusMessage('Unable to load awards data. Please try again later.', true);
    revealButton.textContent = 'Load Failed';
    revealButton.style.backgroundColor = '#555';
    revealButton.style.cursor = 'default';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const yearSelect = document.getElementById('yearSelect');
  if (!yearSelect) {
    throw new Error('Year selector missing from the page.');
  }

  document.querySelectorAll('section[id^="view-"]').forEach(section => {
    const id = section.id.replace('view-', '');
    viewSections[id] = section;
    if (!section.classList.contains('view-active')) {
      section.hidden = true;
    }
  });

  document.querySelectorAll('.tab-button').forEach(button => {
    const viewId = button.dataset.view;
    if (viewId) {
      tabButtons[viewId] = button;
      button.addEventListener('click', () => showView(viewId));
    }
  });

  initializeExchangeImport();
  initializeVotingForm();

  yearSelect.addEventListener('change', event => {
    const year = event.target.value;
    loadYearData(year);
  });

  loadYearData(yearSelect.value);
});
