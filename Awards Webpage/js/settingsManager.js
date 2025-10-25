(function (global, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(global);
  } else {
    global.AwardsSettings = factory(global);
  }
})(typeof self !== 'undefined' ? self : this, function (root) {
  const STORAGE_KEY = 'book-club-awards-settings';

  const FALLBACK_SOUND_OPTIONS = {
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

  const audioModule = (() => {
    if (typeof module === 'object' && module.exports) {
      try {
        return require('./audioCues.js');
      } catch (error) {
        return null;
      }
    }
    if (root && root.CeremonyAudio) {
      return root.CeremonyAudio;
    }
    return null;
  })();

  const channelDefinitions = audioModule && audioModule.DEFAULT_CHANNELS ? audioModule.DEFAULT_CHANNELS : null;

  const SOUND_OPTIONS = channelDefinitions
    ? Object.fromEntries(
        Object.entries(channelDefinitions).map(([channel, options]) => [
          channel,
          options.map(option => ({
            id: option.id,
            label: option.label,
            src: Object.prototype.hasOwnProperty.call(option, 'src') ? option.src : null
          }))
        ])
      )
    : FALLBACK_SOUND_OPTIONS;

  const DEFAULTS = channelDefinitions
    ? {
        revealSound: (channelDefinitions.revealSound[0] && channelDefinitions.revealSound[0].id) || 'explosion',
        winnerSound: (channelDefinitions.winnerSound[0] && channelDefinitions.winnerSound[0].id) || 'winner_fanfare'
      }
    : {
        revealSound: FALLBACK_SOUND_OPTIONS.revealSound[0].id,
        winnerSound: FALLBACK_SOUND_OPTIONS.winnerSound[0].id
      };

  function validateOption(key, value) {
    const options = SOUND_OPTIONS[key] || [];
    const fallback = DEFAULTS[key] || (options[0] && options[0].id) || '';
    if (!options.length) {
      return fallback;
    }
    const match = options.find(option => option.id === value);
    return match ? match.id : fallback;
  }

  function normalizeSettings(settings) {
    const base = settings && typeof settings === 'object' ? settings : {};
    return {
      revealSound: validateOption('revealSound', base.revealSound),
      winnerSound: validateOption('winnerSound', base.winnerSound)
    };
  }

  function createController(storage) {
    const store = storage && typeof storage.getItem === 'function' ? storage : null;

    return {
      load() {
        if (!store) {
          return normalizeSettings(DEFAULTS);
        }
        try {
          const raw = store.getItem(STORAGE_KEY);
          if (!raw) {
            return normalizeSettings(DEFAULTS);
          }
          const parsed = JSON.parse(raw);
          return normalizeSettings(parsed);
        } catch (error) {
          return normalizeSettings(DEFAULTS);
        }
      },
      save(settings) {
        const normalized = normalizeSettings(settings);
        if (store) {
          try {
            store.setItem(STORAGE_KEY, JSON.stringify(normalized));
          } catch (error) {
            // Swallow storage errors (quota, private browsing, etc.).
          }
        }
        return normalized;
      },
      normalize: normalizeSettings
    };
  }

  return {
    STORAGE_KEY,
    DEFAULTS,
    SOUND_OPTIONS,
    normalizeSettings,
    createController
  };
});
