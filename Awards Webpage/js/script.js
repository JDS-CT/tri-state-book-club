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
const awardsCache = new Map();
let backgroundUpdateToken = 0;
let diagnosticsChannel = null;
let diagnosticsConsoleInstance = null;
let settingsController = null;
let audioSettings = null;
let settingsInitialized = false;
let audioCueManager = null;

const diagnosticsSourceElements = {
  canonicalLink: null,
  rawLink: null,
  refreshButton: null
};

const SettingsModule = typeof AwardsSettings !== 'undefined' ? AwardsSettings : null;
const AudioModule = typeof CeremonyAudio !== 'undefined' ? CeremonyAudio : null;
const SOUND_OPTIONS = SettingsModule ? SettingsModule.SOUND_OPTIONS : {
  revealSound: [
    { id: 'explosion', label: 'Classic Explosion', src: 'audio/explosion.mp3' },
    { id: 'explosion_rev1', label: 'Echoing Explosion', src: 'audio/explosion_rev1.mp3' }
  ],
  winnerSound: [
    { id: 'winner_fanfare', label: 'Triumphant Fanfare', src: 'audio/winner_fanfare.mp3' },
    { id: 'three_thirty_four', label: 'Three Thirty Four Theme', src: 'audio/threeThirtyFour.mp3' },
    { id: 'tombstone_theme', label: 'Four-Dimensional Tombstone Elegy (Synth)', src: null }
  ]
};
const SETTINGS_STORAGE_KEY = SettingsModule && SettingsModule.STORAGE_KEY
  ? SettingsModule.STORAGE_KEY
  : 'book-club-awards-settings';
const DEFAULT_AUDIO_SETTINGS = SettingsModule && typeof SettingsModule.normalizeSettings === 'function'
  ? SettingsModule.normalizeSettings(SettingsModule.DEFAULTS)
  : {
      revealSound: (SOUND_OPTIONS.revealSound[0] && SOUND_OPTIONS.revealSound[0].id) || 'explosion',
      winnerSound: (SOUND_OPTIONS.winnerSound[0] && SOUND_OPTIONS.winnerSound[0].id) || 'winner_fanfare'
    };

const VIDEO_LIBRARY = {
  '2025': {
    basePath: '../years/2025/videos',
    sequence: [
      '01-best-book.mp4',
      '02-best-character.mp4',
      '03-worst-book.mp4',
      '04-worst-character.mp4',
      '05-best-plot-twist.mp4',
      '06-memorable-use-of-imagery.mp4',
      '07-attractive-character.mp4',
      '08-supporting-character.mp4',
      '09-original-concept.mp4',
      '10-most-anticipated-before-reading.mp4',
      '11-most-memorable-book-club-moment.mp4',
      '12-best-book-of-all-time.mp4',
      '13-book-to-re-read.mp4'
    ],
    categories: {
      'best book': '01-best-book.mp4',
      'best character': '02-best-character.mp4',
      'worst book': '03-worst-book.mp4',
      'worst character': '04-worst-character.mp4',
      'best plot twist': '05-best-plot-twist.mp4',
      'memorable use of imagery': '06-memorable-use-of-imagery.mp4',
      'attractive character': '07-attractive-character.mp4',
      'supporting character': '08-supporting-character.mp4',
      'original concept': '09-original-concept.mp4',
      'most anticipated before reading': '10-most-anticipated-before-reading.mp4',
      'most memorable book club moment': '11-most-memorable-book-club-moment.mp4',
      'best book of all time': '12-best-book-of-all-time.mp4',
      'book to re-read (all book club years)': '13-book-to-re-read.mp4',
      'book to re-read': '13-book-to-re-read.mp4'
    }
  }
};

function normalizeVideoKey(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function resolveWinnerVideoSource(year, awardIndex, category) {
  const key = String(year || '');
  const library = VIDEO_LIBRARY[key];
  if (!library) {
    return null;
  }

  let filename = null;
  if (Array.isArray(library.sequence) && typeof awardIndex === 'number') {
    if (awardIndex >= 0 && awardIndex < library.sequence.length) {
      filename = library.sequence[awardIndex];
    }
  }

  const normalizedCategory = normalizeVideoKey(category);
  if (normalizedCategory && library.categories && library.categories[normalizedCategory]) {
    filename = library.categories[normalizedCategory];
  }

  if (!filename) {
    return null;
  }

  const base = (library.basePath || '').replace(/\/?$/, '');
  if (!base) {
    return filename;
  }
  return `${base}/${filename}`;
}

function hideWinnerVideoDisplay() {
  const container = document.getElementById('winnerVideoContainer');
  const video = document.getElementById('winnerVideo');
  const caption = document.getElementById('winnerVideoCaption');

  if (container) {
    container.hidden = true;
    container.setAttribute('aria-hidden', 'true');
    container.removeAttribute('data-visible');
  }

  if (video) {
    try {
      video.pause();
    } catch (_) {
      /* pause best-effort */
    }
    if (typeof video.currentTime === 'number') {
      try {
        video.currentTime = 0;
      } catch (_) {
        /* ignore reset failures */
      }
    }
  }

  if (caption) {
    caption.textContent = '';
  }

  const button = document.getElementById('revealVideoButton');
  if (button && button.dataset.videoSrc) {
    button.textContent = 'Reveal Winner Video';
  }
}

function resetWinnerVideoState() {
  hideWinnerVideoDisplay();
  const button = document.getElementById('revealVideoButton');
  if (button) {
    button.disabled = true;
    button.textContent = 'Reveal Winner Video';
    button.removeAttribute('data-video-src');
    button.removeAttribute('data-video-category');
    button.removeAttribute('data-video-year');
  }

  const video = document.getElementById('winnerVideo');
  if (video && video.hasAttribute('src')) {
    video.removeAttribute('src');
    try {
      video.load();
    } catch (_) {
      /* ignore reload failures */
    }
  }
}

function prepareWinnerVideo(award, context) {
  const button = document.getElementById('revealVideoButton');
  if (!button || !award) {
    resetWinnerVideoState();
    return;
  }

  hideWinnerVideoDisplay();

  const year = context && context.year ? context.year : activeYear;
  const index = context && typeof context.index === 'number' ? context.index : null;
  const source = resolveWinnerVideoSource(year, index, award.category);
  if (!source) {
    button.disabled = true;
    button.textContent = 'No Video Available';
    button.removeAttribute('data-video-src');
    button.removeAttribute('data-video-category');
    button.removeAttribute('data-video-year');
    return;
  }

  button.disabled = false;
  button.textContent = 'Reveal Winner Video';
  button.dataset.videoSrc = source;
  button.dataset.videoCategory = award.category || '';
  button.dataset.videoYear = year || '';
}

function setWinnerVideoAvailability(year) {
  const button = document.getElementById('revealVideoButton');
  const container = document.getElementById('winnerVideoContainer');
  const key = String(year || '');
  const hasLibrary = Boolean(VIDEO_LIBRARY[key]);

  if (button) {
    button.hidden = !hasLibrary;
    button.setAttribute('aria-hidden', hasLibrary ? 'false' : 'true');
    if (!hasLibrary) {
      button.disabled = true;
      button.textContent = 'Reveal Winner Video';
      button.removeAttribute('data-video-src');
      button.removeAttribute('data-video-category');
      button.removeAttribute('data-video-year');
    }
  }

  if (container && !hasLibrary) {
    container.hidden = true;
    container.setAttribute('aria-hidden', 'true');
    container.removeAttribute('data-visible');
  }

  if (!hasLibrary) {
    const video = document.getElementById('winnerVideo');
    if (video && video.hasAttribute('src')) {
      video.removeAttribute('src');
      try {
        video.load();
      } catch (_) {
        /* ignore */
      }
    }
  }
}

function toggleWinnerVideo() {
  const button = document.getElementById('revealVideoButton');
  const container = document.getElementById('winnerVideoContainer');
  const video = document.getElementById('winnerVideo');
  const caption = document.getElementById('winnerVideoCaption');

  if (!button || !container || !video) {
    return;
  }

  const source = button.dataset.videoSrc;
  if (!source) {
    return;
  }

  const isVisible = container.getAttribute('data-visible') === 'true';
  if (isVisible) {
    hideWinnerVideoDisplay();
    return;
  }

  if (video.getAttribute('src') !== source) {
    video.setAttribute('src', source);
    try {
      video.load();
    } catch (_) {
      /* ignore load failures */
    }
  }

  if (caption) {
    const category = button.dataset.videoCategory || 'Winner Video';
    const yearLabel = button.dataset.videoYear ? ` — ${button.dataset.videoYear}` : '';
    caption.textContent = `${category}${yearLabel}`;
  }

  container.hidden = false;
  container.setAttribute('aria-hidden', 'false');
  container.setAttribute('data-visible', 'true');
  button.textContent = 'Hide Winner Video';

  const playAttempt = video.play();
  if (playAttempt && typeof playAttempt.then === 'function') {
    playAttempt.catch(() => {
      /* autoplay can be blocked; controls remain available */
    });
  }
}

const viewRenderers = {
  reveal: () => {},
  nominations: renderNominationsView,
  winners: renderWinnersView,
  data: renderDataExchangeView,
  diagnostics: renderDiagnosticsView,
  voting: renderVotingPrototypeView,
  settings: renderSettingsView
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

function rememberAwardsPayload(payload, fallbackYear) {
  if (!payload || typeof payload !== 'object') {
    return;
  }
  const canonicalYear = payload.year || fallbackYear;
  if (canonicalYear) {
    const key = String(canonicalYear);
    awardsCache.set(key, payload);
  }
}

function getEmbeddedManifestEntry(year) {
  const key = String(year);
  if (typeof AwardsEmbeddedData === 'undefined' || !AwardsEmbeddedData) {
    return null;
  }

  try {
    if (typeof AwardsEmbeddedData.get === 'function') {
      const entry = AwardsEmbeddedData.get(key);
      if (entry) {
        return entry;
      }
    }

    const manifest = AwardsEmbeddedData.byYear;
    if (manifest && typeof manifest === 'object') {
      if (Object.prototype.hasOwnProperty.call(manifest, key)) {
        return manifest[key];
      }
      const numericKey = Number.parseInt(key, 10);
      if (Number.isFinite(numericKey) && Object.prototype.hasOwnProperty.call(manifest, numericKey)) {
        return manifest[numericKey];
      }
    }
  } catch (_) {
    return null;
  }

  return null;
}

function buildRelativeHref(base, resourcePath) {
  const normalizedBase = String(base || '').replace(/^\/+|\/+$/g, '');
  const normalizedPath = String(resourcePath || '').replace(/^\/+/, '');
  const segments = [];

  if (normalizedBase) {
    segments.push(normalizedBase);
  }
  if (normalizedPath) {
    segments.push(normalizedPath);
  }

  if (!segments.length) {
    return null;
  }

  return `../${segments.join('/')}`;
}

function deriveRawSubmissionsPath(entryPath) {
  if (typeof entryPath !== 'string') {
    return null;
  }
  if (!/award-nominations\.json$/i.test(entryPath)) {
    return null;
  }
  return entryPath.replace(/award-nominations\.json$/i, 'raw-submissions.md');
}

function updateSourceControls(year) {
  const entry = getEmbeddedManifestEntry(year);
  const canonicalLink = diagnosticsSourceElements.canonicalLink;
  const rawLink = diagnosticsSourceElements.rawLink;
  const refreshButton = diagnosticsSourceElements.refreshButton;

  if (!entry) {
    if (canonicalLink) {
      canonicalLink.hidden = true;
    }
    if (rawLink) {
      rawLink.hidden = true;
    }
    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.removeAttribute('data-canonical-base');
      refreshButton.removeAttribute('data-canonical-path');
      refreshButton.title = 'Canonical data unavailable for this year.';
    }
    return;
  }

  const manifestBase = entry.base || (typeof AwardsEmbeddedData !== 'undefined' && AwardsEmbeddedData.manifestBase) || 'years';
  const canonicalHref = buildRelativeHref(manifestBase, entry.path || '');
  const rawHref = buildRelativeHref(manifestBase, deriveRawSubmissionsPath(entry.path));

  if (canonicalLink) {
    if (canonicalHref) {
      canonicalLink.href = canonicalHref;
      canonicalLink.textContent = `${year} canonical nominations`;
      canonicalLink.hidden = false;
    } else {
      canonicalLink.hidden = true;
    }
  }

  if (rawLink) {
    if (rawHref) {
      rawLink.href = rawHref;
      rawLink.textContent = `${year} raw submissions`;
      rawLink.hidden = false;
    } else {
      rawLink.hidden = true;
    }
  }

  if (refreshButton) {
    refreshButton.disabled = false;
    refreshButton.dataset.canonicalBase = manifestBase;
    refreshButton.dataset.canonicalPath = entry.path || '';
    refreshButton.title = `Reload ${year} directly from ${manifestBase}/${entry.path || ''}`;
  }
}

function getEligibleYears(maxYear) {
  const numericMax = Number.parseInt(String(maxYear), 10);
  if (!Number.isFinite(numericMax)) {
    return [];
  }

  const select = document.getElementById('yearSelect');
  if (!select) {
    return [];
  }

  return Array.from(select.options)
    .map(option => Number.parseInt(option.value, 10))
    .filter(value => Number.isFinite(value) && value <= numericMax);
}

function renderBackgroundWordCloud(words, container) {
  container.innerHTML = '';
  if (!Array.isArray(words) || !words.length) {
    return;
  }

  const pool = words.slice();
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const limit = Math.min(pool.length, 60);
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < limit; index += 1) {
    const word = pool[index];
    const span = document.createElement('span');
    span.className = 'background-word';
    span.textContent = word;

    span.style.left = `${Math.random() * 100}%`;
    span.style.top = `${Math.random() * 100}%`;
    span.style.setProperty('--dx', `${(Math.random() * 60 - 30).toFixed(2)}vw`);
    span.style.setProperty('--dy', `${(Math.random() * 60 - 30).toFixed(2)}vh`);
    span.style.setProperty('--duration', `${(16 + Math.random() * 12).toFixed(2)}s`);
    span.style.setProperty('--delay', `${(Math.random() * 8).toFixed(2)}s`);
    span.style.setProperty('--scale', `${(0.8 + Math.random() * 0.7).toFixed(2)}`);
    span.style.setProperty('--opacity', `${(0.3 + Math.random() * 0.35).toFixed(2)}`);

    fragment.appendChild(span);
  }

  container.appendChild(fragment);
}

async function updateBackgroundWordCloud(year, token) {
  const container = document.getElementById('backgroundWords');
  if (!container || typeof BackgroundWords === 'undefined') {
    return;
  }

  const eligibleYears = getEligibleYears(year);
  if (!eligibleYears.length) {
    if (token === backgroundUpdateToken) {
      container.innerHTML = '';
    }
    return;
  }

  eligibleYears.sort((a, b) => a - b);

  for (const value of eligibleYears) {
    const key = String(value);
    if (awardsCache.has(key)) {
      continue;
    }
    try {
      const payload = await AwardsLoader.loadAwardsData({ year: key });
      rememberAwardsPayload(payload, key);
    } catch (error) {
      console.warn(`Background preload failed for ${key}:`, error);
    }
    if (token !== backgroundUpdateToken) {
      return;
    }
  }

  if (token !== backgroundUpdateToken) {
    return;
  }

  const words = BackgroundWords.collectWordsFromAwards({
    awardsByYear: awardsCache,
    maxYear: year
  });

  if (token !== backgroundUpdateToken) {
    return;
  }

  renderBackgroundWordCloud(words, container);
}

function requestBackgroundUpdate(year) {
  backgroundUpdateToken += 1;
  const token = backgroundUpdateToken;
  updateBackgroundWordCloud(year, token).catch(error => {
    console.error('Background word update failed:', error);
  });
}

function getCategoryNames() {
  return awards.map(entry => entry.category);
}

function normalizeAudioSettings(settings) {
  if (SettingsModule && typeof SettingsModule.normalizeSettings === 'function') {
    return SettingsModule.normalizeSettings(settings);
  }
  const source = settings && typeof settings === 'object' ? settings : {};
  const normalized = {};
  ['revealSound', 'winnerSound'].forEach(key => {
    const options = SOUND_OPTIONS[key] || [];
    const fallback = DEFAULT_AUDIO_SETTINGS[key] || (options[0] && options[0].id) || '';
    const candidate = source[key];
    if (options.some(option => option.id === candidate)) {
      normalized[key] = candidate;
    } else {
      normalized[key] = fallback;
    }
  });
  return normalized;
}

function resolveSoundOption(key, value) {
  const options = SOUND_OPTIONS[key] || [];
  if (!options.length) {
    return null;
  }
  const match = options.find(option => option.id === value);
  return match || options[0];
}

function ensureAudioCueManager() {
  if (audioCueManager) {
    return audioCueManager;
  }
  if (!AudioModule || typeof AudioModule.createAudioCueManager !== 'function') {
    return null;
  }
  const channels = AudioModule.DEFAULT_CHANNELS || {};
  audioCueManager = AudioModule.createAudioCueManager({
    channels,
    getElementById: id => document.getElementById(id)
  });
  return audioCueManager;
}

function applyAudioSettingsToUi(settings) {
  const revealOption = resolveSoundOption('revealSound', settings.revealSound);
  const winnerOption = resolveSoundOption('winnerSound', settings.winnerSound);

  const manager = ensureAudioCueManager();
  if (manager) {
    if (revealOption) {
      manager.select('revealSound', revealOption.id);
    }
    if (winnerOption) {
      manager.select('winnerSound', winnerOption.id);
    }
  } else {
    const revealAudio = document.getElementById('explosionSound');
    if (revealAudio && revealOption && revealOption.src) {
      const currentSrc = revealAudio.getAttribute('src');
      if (currentSrc !== revealOption.src) {
        revealAudio.setAttribute('src', revealOption.src);
        if (typeof revealAudio.pause === 'function') {
          revealAudio.pause();
        }
        if ('currentTime' in revealAudio) {
          revealAudio.currentTime = 0;
        }
        if (typeof revealAudio.load === 'function') {
          revealAudio.load();
        }
      }
    }

    const winnerAudio = document.getElementById('winnerSound');
    if (winnerAudio && winnerOption && winnerOption.src) {
      const currentSrc = winnerAudio.getAttribute('src');
      if (currentSrc !== winnerOption.src) {
        winnerAudio.setAttribute('src', winnerOption.src);
        if (typeof winnerAudio.pause === 'function') {
          winnerAudio.pause();
        }
        if ('currentTime' in winnerAudio) {
          winnerAudio.currentTime = 0;
        }
        if (typeof winnerAudio.load === 'function') {
          winnerAudio.load();
        }
      }
    }
  }

  const revealSelect = document.getElementById('revealSoundSelect');
  if (revealSelect && revealOption) {
    revealSelect.value = revealOption.id;
  }

  const winnerSelect = document.getElementById('winnerSoundSelect');
  if (winnerSelect && winnerOption) {
    winnerSelect.value = winnerOption.id;
  }
}

function playAudioCue(channel, fallbackElementId) {
  const manager = ensureAudioCueManager();
  if (manager) {
    manager.play(channel).catch(() => {});
    return;
  }

  if (!fallbackElementId) {
    return;
  }
  const element = document.getElementById(fallbackElementId);
  if (!element || typeof element.play !== 'function') {
    return;
  }
  if ('currentTime' in element) {
    try {
      element.currentTime = 0;
    } catch (error) {
      element.currentTime = 0;
    }
  }
  try {
    element.play();
  } catch (error) {
    // Ignore playback rejections in fallback mode.
  }
}

function getPersistentStorage() {
  try {
    const storage = window.localStorage;
    const probeKey = `${SETTINGS_STORAGE_KEY}::probe`;
    storage.setItem(probeKey, 'ok');
    storage.removeItem(probeKey);
    return storage;
  } catch (error) {
    return null;
  }
}

function createFallbackSettingsController(storage) {
  const store = storage && typeof storage.getItem === 'function' ? storage : null;
  return {
    load() {
      if (!store) {
        return normalizeAudioSettings(DEFAULT_AUDIO_SETTINGS);
      }
      try {
        const raw = store.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) {
          return normalizeAudioSettings(DEFAULT_AUDIO_SETTINGS);
        }
        const parsed = JSON.parse(raw);
        return normalizeAudioSettings(parsed);
      } catch (error) {
        return normalizeAudioSettings(DEFAULT_AUDIO_SETTINGS);
      }
    },
    save(settings) {
      const normalized = normalizeAudioSettings(settings);
      if (store) {
        try {
          store.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
        } catch (error) {
          // Storage may be unavailable (private browsing, quota errors, etc.).
        }
      }
      return normalized;
    },
    normalize: normalizeAudioSettings
  };
}

function getSettingsController() {
  if (settingsController) {
    return settingsController;
  }
  const storage = getPersistentStorage();
  if (SettingsModule && typeof SettingsModule.createController === 'function') {
    settingsController = SettingsModule.createController(storage);
  } else {
    settingsController = createFallbackSettingsController(storage);
  }
  return settingsController;
}

function populateSoundSelect(select, key) {
  if (!select) {
    return;
  }
  const options = SOUND_OPTIONS[key] || [];
  select.innerHTML = '';
  options.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.id;
    opt.textContent = option.label;
    select.appendChild(opt);
  });
}

function updateAudioSettings(nextSettings, options = {}) {
  const controller = getSettingsController();
  const base = audioSettings || normalizeAudioSettings(DEFAULT_AUDIO_SETTINGS);
  const merged = Object.assign({}, base, nextSettings || {});
  const normalized = controller && typeof controller.normalize === 'function'
    ? controller.normalize(merged)
    : normalizeAudioSettings(merged);
  audioSettings = normalized;
  applyAudioSettingsToUi(normalized);
  if (!options.skipPersist && controller && typeof controller.save === 'function') {
    controller.save(normalized);
  }
  return normalized;
}

function initializeSettingsView() {
  if (settingsInitialized) {
    return;
  }
  const revealSelect = document.getElementById('revealSoundSelect');
  const winnerSelect = document.getElementById('winnerSoundSelect');
  if (!revealSelect || !winnerSelect) {
    return;
  }

  populateSoundSelect(revealSelect, 'revealSound');
  populateSoundSelect(winnerSelect, 'winnerSound');

  const controller = getSettingsController();
  const loaded = controller && typeof controller.load === 'function'
    ? controller.load()
    : normalizeAudioSettings(DEFAULT_AUDIO_SETTINGS);
  updateAudioSettings(loaded, { skipPersist: true });

  const handleChange = event => {
    const target = event.target;
    if (!target || !target.name) {
      return;
    }
    updateAudioSettings({ [target.name]: target.value });
  };

  revealSelect.addEventListener('change', handleChange);
  winnerSelect.addEventListener('change', handleChange);

  settingsInitialized = true;
}

function renderDiagnosticsView() {
  if (diagnosticsConsoleInstance && typeof diagnosticsConsoleInstance.render === 'function') {
    diagnosticsConsoleInstance.render();
  }
}

function renderSettingsView() {
  initializeSettingsView();
  if (!audioSettings) {
    updateAudioSettings(DEFAULT_AUDIO_SETTINGS, { skipPersist: true });
  } else {
    applyAudioSettingsToUi(audioSettings);
  }
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

  if (viewId !== 'reveal') {
    hideWinnerVideoDisplay();
  }

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

  resetWinnerVideoState();

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
      playAudioCue('revealSound', 'explosionSound');

      nominationDivs.forEach(nomDiv => {
        nomDiv.classList.add('explode');
      });
    }, totalNominationDisplayTime);

    setTimeout(() => {
      const winnerDiv = document.createElement('div');
      winnerDiv.id = 'winner';
      contentDiv.appendChild(winnerDiv);

      playAudioCue('winnerSound', 'winnerSound');

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
              prepareWinnerVideo(award, { year: activeYear, index: currentIndex });
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

async function loadYearData(year, runtimeOptions = {}) {
  const { loaderOverrides = {}, statusMessage = null, propagateError = false } = runtimeOptions;
  const revealButton = document.getElementById('revealButton');
  if (!revealButton) {
    throw new Error('Reveal button missing from the page.');
  }

  setWinnerVideoAvailability(year);
  resetWinnerVideoState();

  revealButton.disabled = true;
  revealButton.textContent = 'Loading…';
  revealButton.style.backgroundColor = '#555';
  revealButton.style.cursor = 'default';
  setStatusMessage('Loading awards, please stand by.');

  if (diagnosticsChannel) {
    const overrideKeys = Object.keys(loaderOverrides);
    diagnosticsChannel.log('ui:load-request', {
      year,
      overrides: overrideKeys.length ? overrideKeys : ['default']
    });
  }

  try {
    const loaderOptions = Object.assign({ year, diagnostics: diagnosticsChannel }, loaderOverrides);
    const payload = await AwardsLoader.loadAwardsData(loaderOptions);
    awards = payload.categories;
    activeYear = payload.year || year;
    ceremonyTitle = payload.title || '';
    currentIndex = 0;

    setWinnerVideoAvailability(activeYear);
    resetWinnerVideoState();

    rememberAwardsPayload(payload, year);

    updateSubtitle();
    refreshAllViews();
    requestBackgroundUpdate(activeYear);

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

    if (diagnosticsChannel) {
      diagnosticsChannel.log('ui:load-success', {
        year: activeYear,
        categories: awards.length,
        overrides: Object.keys(loaderOverrides)
      });
    }

    if (diagnosticsConsoleInstance) {
      const message = statusMessage || `Loaded awards for ${activeYear}.`;
      diagnosticsConsoleInstance.setStatus(message);
    }

    if (statusMessage) {
      return { message: statusMessage };
    }
    return { message: `Loaded awards for ${activeYear}.` };
  } catch (error) {
    console.error(error);
    awards = [];
    refreshAllViews();
    setStatusMessage('Unable to load awards data. Please try again later.', true);
    revealButton.textContent = 'Load Failed';
    revealButton.style.backgroundColor = '#555';
    revealButton.style.cursor = 'default';

    if (diagnosticsChannel) {
      diagnosticsChannel.log('ui:load-error', {
        year,
        message: error && error.message ? error.message : 'Unknown error'
      });
    }

    if (diagnosticsConsoleInstance) {
      diagnosticsConsoleInstance.setStatus(error && error.message ? error.message : 'Load failed.');
    }

    if (propagateError) {
      throw error;
    }

    return { message: error && error.message ? error.message : 'Load failed.' };
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
  initializeSettingsView();

  const revealVideoButton = document.getElementById('revealVideoButton');
  if (revealVideoButton) {
    revealVideoButton.addEventListener('click', toggleWinnerVideo);
  }

  diagnosticsChannel = AwardsLoader.createDiagnosticsChannel();

  const diagnosticsPanel = document.getElementById('diagnosticsPanel');
  diagnosticsSourceElements.canonicalLink = document.getElementById('canonicalSourceLink');
  diagnosticsSourceElements.rawLink = document.getElementById('rawSubmissionsLink');
  diagnosticsSourceElements.refreshButton = diagnosticsPanel
    ? diagnosticsPanel.querySelector('[data-diagnostics-action="refresh-canonical"]')
    : document.querySelector('[data-diagnostics-action="refresh-canonical"]');
  if (diagnosticsPanel && typeof AwardsDiagnosticsConsole !== 'undefined') {
    const clipboardHandler = text => {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        return navigator.clipboard.writeText(text);
      }
      throw new Error('Clipboard API is unavailable in this environment.');
    };

    diagnosticsConsoleInstance = AwardsDiagnosticsConsole.createConsole({
      container: diagnosticsPanel,
      channel: diagnosticsChannel,
      clipboard: clipboardHandler,
      actions: {
        reload: () => {
          const year = yearSelect.value;
          diagnosticsChannel.log('ui:action', { action: 'reload', year });
          return loadYearData(year, {
            statusMessage: `Reloaded ${year} via default loader.`
          });
        },
        'force-fetch': () => {
          const year = yearSelect.value;
          diagnosticsChannel.log('ui:action', { action: 'force-fetch', year });
          if (typeof fetch !== 'function') {
            throw new Error('Fetch API is not available.');
          }
          return loadYearData(year, {
            loaderOverrides: {
              fetchImpl: resource => fetch(resource),
              xhrImpl: () => {
                throw new Error('XHR disabled during fetch-only diagnostics.');
              }
            },
            statusMessage: `Reloaded ${year} using fetch only.`
          });
        },
        'force-xhr': () => {
          const year = yearSelect.value;
          diagnosticsChannel.log('ui:action', { action: 'force-xhr', year });
          return loadYearData(year, {
            loaderOverrides: {
              fetchImpl: async () => {
                throw new Error('Fetch intentionally disabled for diagnostics.');
              },
              xhrImpl: () => new XMLHttpRequest()
            },
            statusMessage: `Reloaded ${year} using the XHR fallback.`,
            propagateError: true
          });
        },
        'simulate-failure': async () => {
          const year = yearSelect.value;
          diagnosticsChannel.log('ui:action', { action: 'simulate-failure', year });
          try {
            await AwardsLoader.loadAwardsData({
              year,
              basePath: 'invalid-path',
              fetchImpl: async () => ({ ok: false, status: 500 }),
              xhrImpl: () => ({
                open() {
                  throw new Error('XHR disabled for failure simulation.');
                }
              }),
              diagnostics: diagnosticsChannel
            });
            return { message: 'Unexpected success while simulating failure—check file paths.' };
          } catch (error) {
            return { message: `Failure simulated: ${error.message}` };
          }
        },
        'refresh-canonical': () => {
          const year = yearSelect.value;
          diagnosticsChannel.log('ui:action', { action: 'refresh-canonical', year });
          const refreshButton = diagnosticsSourceElements.refreshButton;
          if (refreshButton) {
            refreshButton.disabled = true;
          }

          const loaderOverrides = { disableEmbedded: true };
          if (typeof fetch === 'function') {
            loaderOverrides.fetchImpl = resource => fetch(resource, { cache: 'no-store' });
          }
          if (typeof XMLHttpRequest !== 'undefined') {
            loaderOverrides.xhrImpl = () => new XMLHttpRequest();
          }

          return loadYearData(year, {
            loaderOverrides,
            statusMessage: `Reloaded ${year} from canonical files.`,
            propagateError: true
          })
            .catch(error => {
              const message = error && error.message ? error.message : 'Unable to refresh from canonical files.';
              throw new Error(message);
            })
            .finally(() => {
              updateSourceControls(year);
            });
        },
        'show-cache': () => {
          const cachedYears = Array.from(awardsCache.keys());
          diagnosticsChannel.log('ui:action', { action: 'show-cache', cachedYears });
          if (!cachedYears.length) {
            return { message: 'No cached years yet.' };
          }
          return { message: `Cached years: ${cachedYears.join(', ')}` };
        }
      }
    });

    diagnosticsChannel.log('ui:init', { message: 'Diagnostics console ready.' });
  }

  yearSelect.addEventListener('change', event => {
    const year = event.target.value;
    updateSourceControls(year);
    loadYearData(year);
  });

  updateSourceControls(yearSelect.value);
  loadYearData(yearSelect.value);
});
