(function (global, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    global.CeremonyAudio = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const TOMBSTONE_THEME_ID = 'tombstone_theme';

  function createDefaultAudioContextFactory() {
    let cachedContext = null;
    return () => {
      if (cachedContext) {
        return cachedContext;
      }
      const ContextConstructor =
        (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) || null;
      if (!ContextConstructor) {
        return null;
      }
      cachedContext = new ContextConstructor();
      return cachedContext;
    };
  }

  function ensureSourceOnElement(element, descriptor) {
    if (!element || !descriptor || !descriptor.src) {
      return;
    }
    const current = element.getAttribute ? element.getAttribute('src') : element.src;
    if (current === descriptor.src) {
      return;
    }
    if (typeof element.setAttribute === 'function') {
      element.setAttribute('src', descriptor.src);
    } else if ('src' in element) {
      element.src = descriptor.src;
    }
    if (typeof element.pause === 'function') {
      try {
        element.pause();
      } catch (error) {
        // Swallow playback state errors (detached nodes, etc.).
      }
    }
    if ('currentTime' in element) {
      try {
        element.currentTime = 0;
      } catch (error) {
        element.currentTime = 0;
      }
    }
    if (typeof element.load === 'function') {
      try {
        element.load();
      } catch (error) {
        // Ignore load errors when the element is detached.
      }
    }
  }

  function createNoiseBuffer(context, durationSeconds) {
    const sampleRate = context.sampleRate || 44100;
    const frameCount = Math.max(1, Math.floor(sampleRate * durationSeconds));
    const buffer = context.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < frameCount; index += 1) {
      const fade = Math.min(index / frameCount, 1);
      data[index] = (Math.random() * 2 - 1) * (0.4 - fade * 0.3);
    }
    return buffer;
  }

  function scheduleTombstoneTheme(context) {
    const duration = 18;
    const start = context.currentTime;
    const end = start + duration;

    const masterGain = context.createGain();
    masterGain.gain.setValueAtTime(0.0001, start);
    masterGain.gain.exponentialRampToValueAtTime(0.35, start + 2.5);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, end);
    masterGain.connect(context.destination);

    const voiceDefinitions = [
      { type: 'sine', frequency: 82.41, detune: -6, offset: 0, sustain: 0.22 },
      { type: 'triangle', frequency: 123.47, detune: 3, offset: 1.6, sustain: 0.18 },
      { type: 'sine', frequency: 164.81, detune: -9, offset: 3.2, sustain: 0.16 },
      { type: 'square', frequency: 55, detune: 1, offset: 0.5, sustain: 0.14 }
    ];

    voiceDefinitions.forEach((definition, index) => {
      const voiceStart = start + definition.offset;
      const voiceEnd = end - 1 + index * 0.1;
      const oscillator = context.createOscillator();
      oscillator.type = definition.type;
      oscillator.frequency.setValueAtTime(definition.frequency, voiceStart);
      if (oscillator.detune && typeof oscillator.detune.setValueAtTime === 'function') {
        oscillator.detune.setValueAtTime(definition.detune * 10, voiceStart);
      }

      const gain = context.createGain();
      const attack = voiceStart + 1.2;
      const sustainStart = voiceStart + 2.5;
      const sustainEnd = voiceEnd - 1.2;
      const release = voiceEnd;
      const peak = definition.sustain;

      gain.gain.setValueAtTime(0.0001, voiceStart);
      gain.gain.exponentialRampToValueAtTime(peak, attack);
      gain.gain.linearRampToValueAtTime(peak * 0.75, sustainStart);
      gain.gain.linearRampToValueAtTime(peak * 0.6, sustainEnd);
      gain.gain.exponentialRampToValueAtTime(0.0001, release);

      oscillator.connect(gain);
      gain.connect(masterGain);
      oscillator.start(voiceStart);
      oscillator.stop(release);
      oscillator.onended = () => {
        gain.disconnect();
      };
    });

    const shimmer = context.createOscillator();
    shimmer.type = 'sawtooth';
    shimmer.frequency.setValueAtTime(329.63 / 2, start + 0.5);
    const shimmerGain = context.createGain();
    shimmerGain.gain.setValueAtTime(0.0001, start);
    shimmerGain.gain.linearRampToValueAtTime(0.05, start + 4.5);
    shimmerGain.gain.linearRampToValueAtTime(0.035, end - 4);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, end);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    shimmer.start(start + 0.5);
    shimmer.stop(end);
    shimmer.onended = () => {
      shimmerGain.disconnect();
    };

    const noiseSource = context.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(context, duration);
    const noiseGain = context.createGain();
    noiseGain.gain.setValueAtTime(0.0001, start);
    noiseGain.gain.linearRampToValueAtTime(0.06, start + 3);
    noiseGain.gain.linearRampToValueAtTime(0.02, end - 2);
    noiseGain.gain.linearRampToValueAtTime(0.0001, end);
    noiseSource.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start(start);
    noiseSource.stop(end);

    return new Promise(resolve => {
      const cleanup = () => {
        try {
          masterGain.disconnect();
        } catch (error) {
          // Ignore disconnect issues when the context is already closed.
        }
        resolve();
      };

      noiseSource.onended = cleanup;
      setTimeout(cleanup, duration * 1000 + 250);
    });
  }

  function playTombstoneTheme(context) {
    if (!context || typeof context.createOscillator !== 'function' || typeof context.createGain !== 'function') {
      return Promise.resolve();
    }
    return scheduleTombstoneTheme(context);
  }

  const DEFAULT_CHANNELS = {
    revealSound: [
      { id: 'explosion', label: 'Classic Explosion', type: 'file', elementId: 'explosionSound', src: 'audio/explosion.mp3' },
      { id: 'explosion_rev1', label: 'Echoing Explosion', type: 'file', elementId: 'explosionSound', src: 'audio/explosion_rev1.mp3' }
    ],
    winnerSound: [
      { id: 'winner_fanfare', label: 'Triumphant Fanfare', type: 'file', elementId: 'winnerSound', src: 'audio/winner_fanfare.mp3' },
      { id: 'three_thirty_four', label: 'Three Thirty Four Theme', type: 'file', elementId: 'winnerSound', src: 'audio/threeThirtyFour.mp3' },
      { id: TOMBSTONE_THEME_ID, label: 'Four-Dimensional Tombstone Elegy (Synth)', type: 'synth', createPlayer: playTombstoneTheme }
    ]
  };

  function normalizeChannels(channels) {
    const normalized = new Map();
    Object.keys(channels || {}).forEach(channel => {
      const options = channels[channel] || [];
      const entries = options.map(option => Object.assign({ type: 'file' }, option));
      normalized.set(channel, new Map(entries.map(entry => [entry.id, entry])));
    });
    return normalized;
  }

  function createAudioCueManager(options) {
    const getElementById = options.getElementById;
    const createAudioContext = options.createAudioContext;
    const channels = normalizeChannels(options.channels);
    const activeSelections = new Map();

    function select(channel, cueId) {
      const definitions = channels.get(channel);
      if (!definitions || !definitions.size) {
        activeSelections.delete(channel);
        return null;
      }
      const fallback = definitions.values().next().value;
      const entry = definitions.get(cueId) || fallback;
      if (!entry) {
        activeSelections.delete(channel);
        return null;
      }
      activeSelections.set(channel, entry);

      if (entry.type === 'file' && entry.elementId) {
        const element = getElementById(entry.elementId);
        if (element) {
          ensureSourceOnElement(element, entry);
        }
      }
      return entry;
    }

    function play(channel) {
      const entry = activeSelections.get(channel);
      if (!entry) {
        return Promise.resolve();
      }
      if (entry.type === 'file') {
        if (!entry.elementId) {
          return Promise.resolve();
        }
        const element = getElementById(entry.elementId);
        if (!element || typeof element.play !== 'function') {
          return Promise.resolve();
        }
        if ('currentTime' in element) {
          try {
            element.currentTime = 0;
          } catch (error) {
            element.currentTime = 0;
          }
        }
        try {
          const result = element.play();
          if (result && typeof result.then === 'function') {
            return result.catch(() => {});
          }
          return Promise.resolve();
        } catch (error) {
          return Promise.reject(error);
        }
      }

      if (entry.type === 'synth' && typeof entry.createPlayer === 'function') {
        const context = createAudioContext();
        if (!context) {
          return Promise.resolve();
        }
        const startPlayback = () => {
          try {
            const outcome = entry.createPlayer(context);
            return outcome && typeof outcome.then === 'function' ? outcome : Promise.resolve(outcome);
          } catch (error) {
            return Promise.reject(error);
          }
        };
        if (context.state === 'suspended' && typeof context.resume === 'function') {
          return context.resume().then(startPlayback).catch(() => startPlayback());
        }
        return startPlayback();
      }

      return Promise.resolve();
    }

    function getSelectedCue(channel) {
      const entry = activeSelections.get(channel);
      return entry ? entry.id : null;
    }

    function getOptions(channel) {
      const definitions = channels.get(channel);
      if (!definitions) {
        return [];
      }
      return Array.from(definitions.values()).map(entry => ({ id: entry.id, label: entry.label }));
    }

    return {
      select,
      play,
      getSelectedCue,
      getOptions
    };
  }

  const defaultContextFactory = createDefaultAudioContextFactory();

  function factoryCreateAudioCueManager(config) {
    return createAudioCueManager({
      channels: config.channels || DEFAULT_CHANNELS,
      getElementById:
        typeof config.getElementById === 'function'
          ? config.getElementById
          : (id => (typeof document !== 'undefined' ? document.getElementById(id) : null)),
      createAudioContext:
        typeof config.createAudioContext === 'function'
          ? config.createAudioContext
          : () => (defaultContextFactory ? defaultContextFactory() : null)
    });
  }

  return {
    TOMBSTONE_THEME_ID,
    DEFAULT_CHANNELS,
    createAudioCueManager: factoryCreateAudioCueManager
  };
});
