const assert = require('node:assert/strict');
const test = require('node:test');

const AwardsSettings = require('../Awards Webpage/js/settingsManager.js');

test('normalizeSettings falls back to defaults for unknown selections', () => {
  const normalized = AwardsSettings.normalizeSettings({
    revealSound: 'unknown-sound',
    winnerSound: null
  });

  assert.equal(
    normalized.revealSound,
    AwardsSettings.DEFAULTS.revealSound,
    'reveal sound should fall back to the default option'
  );
  assert.equal(
    normalized.winnerSound,
    AwardsSettings.DEFAULTS.winnerSound,
    'winner sound should fall back to the default option'
  );
});

test('createController persists sanitized settings', () => {
  const storage = (() => {
    const backing = new Map();
    return {
      getItem(key) {
        return backing.has(key) ? backing.get(key) : null;
      },
      setItem(key, value) {
        backing.set(key, value);
      }
    };
  })();

  const controller = AwardsSettings.createController(storage);
  const defaults = controller.load();

  assert.deepEqual(
    defaults,
    AwardsSettings.normalizeSettings(AwardsSettings.DEFAULTS),
    'controller.load should return normalized defaults when storage is empty'
  );

  const custom = controller.save({
    revealSound: AwardsSettings.SOUND_OPTIONS.revealSound[1].id,
    winnerSound: 'non-existent'
  });

  assert.equal(
    custom.revealSound,
    AwardsSettings.SOUND_OPTIONS.revealSound[1].id,
    'reveal sound should persist when selecting a known option'
  );
  assert.equal(
    custom.winnerSound,
    AwardsSettings.DEFAULTS.winnerSound,
    'invalid winner selection should revert to default during save'
  );

  const stored = controller.load();
  assert.deepEqual(
    stored,
    custom,
    'controller.load should return the sanitized settings from storage'
  );
});

test('winner sound list exposes the Four-Dimensional Tombstone synth theme', () => {
  const ids = AwardsSettings.SOUND_OPTIONS.winnerSound.map(option => option.id);

  assert.ok(
    ids.includes('tombstone_theme'),
    'winner sound options should include the Four-Dimensional Tombstone synth entry'
  );
});
