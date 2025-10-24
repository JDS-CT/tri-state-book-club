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

test('loadAwardsData retries with alternate base paths when the default lookup fails', async () => {
  const attempts = [];

  async function fallbackFetch(resource) {
    attempts.push(resource);
    if (resource.startsWith('../years/')) {
      return { ok: false };
    }
    if (resource.startsWith('./years/')) {
      return fileFetch(resource.replace(/^\.\//, ''));
    }
    if (resource.startsWith('years/')) {
      return fileFetch(resource);
    }
    throw new Error(`Unexpected resource request: ${resource}`);
  }

  const payload = await loader.loadAwardsData({
    year: '2024',
    fetchImpl: fallbackFetch
  });

  assert.equal(attempts[0], '../years/2024/reveal/awards.json');
  assert.ok(
    attempts.slice(1).some(candidate => candidate.includes('/years/2024/reveal/awards.json')),
    `Expected a retry using an alternate years directory, saw ${attempts.join(', ')}`
  );
  assert.equal(payload.year, '2024');
  assert.equal(payload.categories.length > 0, true);
});
