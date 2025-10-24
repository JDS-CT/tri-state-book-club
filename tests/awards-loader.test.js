const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');

const loader = require('../Awards Webpage/js/awardsLoader.js');

async function fileFetch(resource) {
  const absolutePath = path.resolve(__dirname, '..', resource);
  const raw = await fs.readFile(absolutePath, 'utf-8');
  return {
    ok: true,
    async json() {
      return JSON.parse(raw);
    }
  };
}

test('loadAwardsData returns normalized winners for the requested year', async () => {
  const payload = await loader.loadAwardsData({
    year: '2024',
    basePath: 'years',
    fetchImpl: fileFetch
  });

  assert.equal(payload.year, '2024');
  assert.equal(typeof payload.title, 'string');
  assert.ok(Array.isArray(payload.categories), 'categories should be an array');
  assert.equal(payload.categories.length > 0, true, 'awards should include categories');
  assert.deepEqual(payload.categories[0], {
    category: 'Best Book',
    nominations: [
      '<i>Mister Magic</i>',
      '<i>The Three-Body Problem Series</i>',
      '<i>Intercepts</i>',
      '<i>The Last Murder at the End of the World</i>'
    ],
    winner: '<i>Mister Magic</i>',
    runnerUp: '<i>The Three-Body Problem Series</i>'
  });
});
