const assert = require('node:assert/strict');
const test = require('node:test');

const CeremonyAudio = require('../Awards Webpage/js/audioCues.js');

function createElementStub() {
  const attributes = new Map();
  return {
    currentTime: 5,
    loadCount: 0,
    pauseCount: 0,
    playCount: 0,
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    load() {
      this.loadCount += 1;
    },
    pause() {
      this.pauseCount += 1;
    },
    play() {
      this.playCount += 1;
      return Promise.resolve();
    }
  };
}

test('select falls back to the first option when an unknown id is provided', () => {
  const manager = CeremonyAudio.createAudioCueManager({
    channels: {
      winnerSound: [
        { id: 'first', label: 'First', type: 'file', elementId: 'winnerSound', src: 'first.mp3' },
        { id: 'second', label: 'Second', type: 'file', elementId: 'winnerSound', src: 'second.mp3' }
      ]
    },
    getElementById: () => null
  });

  const selected = manager.select('winnerSound', 'does-not-exist');

  assert.equal(selected.id, 'first', 'manager should fall back to the first cue when the id is unknown');
  assert.equal(
    manager.getSelectedCue('winnerSound'),
    'first',
    'selected cue id should match the fallback entry'
  );
});

test('file cues update the audio element and trigger playback', async () => {
  const element = createElementStub();
  const manager = CeremonyAudio.createAudioCueManager({
    channels: {
      revealSound: [
        { id: 'boom', label: 'Boom', type: 'file', elementId: 'explosionSound', src: 'explosion.mp3' }
      ]
    },
    getElementById: id => (id === 'explosionSound' ? element : null)
  });

  const selection = manager.select('revealSound', 'boom');
  assert.equal(selection.id, 'boom', 'select should return the configured cue');
  assert.equal(
    element.getAttribute('src'),
    'explosion.mp3',
    'audio element should receive the configured source'
  );
  assert.equal(element.currentTime, 0, 'audio currentTime should reset when the cue is selected');
  assert.equal(element.loadCount, 1, 'audio.load should be invoked when switching sources');

  await manager.play('revealSound');

  assert.equal(element.playCount, 1, 'audio.play should be invoked for file-based cues');
});

test('synth cues invoke the generator with the provided audio context', async () => {
  let generatorInvoked = false;
  const fakeContext = {
    state: 'suspended',
    resumeCalls: 0,
    resume() {
      this.resumeCalls += 1;
      return Promise.resolve();
    }
  };

  const manager = CeremonyAudio.createAudioCueManager({
    channels: {
      winnerSound: [
        {
          id: 'tombstone',
          label: 'Four-Dimensional Tombstone',
          type: 'synth',
          createPlayer(context) {
            generatorInvoked = true;
            assert.equal(context, fakeContext, 'generator should receive the provided audio context');
            return Promise.resolve();
          }
        }
      ]
    },
    createAudioContext: () => fakeContext
  });

  manager.select('winnerSound', 'tombstone');
  await manager.play('winnerSound');

  assert.equal(fakeContext.resumeCalls, 1, 'suspended audio contexts should resume before playback');
  assert.ok(generatorInvoked, 'synth generator should be invoked during playback');
});
