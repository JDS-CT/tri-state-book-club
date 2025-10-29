const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');

const loader = require('../Awards Webpage/js/awardsLoader.js');
const embeddedCatalog = require('../Awards Webpage/js/embeddedAwardsData.js');

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

function createFileBackedXhrFactory() {
  return () => {
    let resource = '';
    const xhr = {
      readyState: 0,
      status: 0,
      responseText: '',
      onload: null,
      onerror: null,
      onreadystatechange: null,
      open(method, url) {
        if (method !== 'GET') {
          throw new Error(`Unsupported method ${method}`);
        }
        resource = url;
        this.readyState = 1;
      },
      setRequestHeader() {},
      send() {
        const normalized = resource.startsWith('/') ? resource.slice(1) : resource;
        const absolutePath = path.resolve(__dirname, '..', normalized);
        fs
          .readFile(absolutePath, 'utf-8')
          .then(contents => {
            this.readyState = 4;
            this.status = 200;
            this.responseText = contents;
            if (typeof this.onload === 'function') {
              this.onload();
            }
            if (typeof this.onreadystatechange === 'function') {
              this.onreadystatechange();
            }
          })
          .catch(error => {
            this.readyState = 4;
            this.status = 404;
            this.responseText = '';
            if (typeof this.onerror === 'function') {
              this.onerror(error);
            }
            if (typeof this.onreadystatechange === 'function') {
              this.onreadystatechange();
            }
          });
      }
    };
    return xhr;
  };
}

test('loadAwardsData merges canonical nominations with awards winners for 2025', async () => {
  const diagnostics = loader.createDiagnosticsChannel();
  const payload = await loader.loadAwardsData({
    year: '2025',
    basePath: 'years',
    fetchImpl: fileFetch,
    diagnostics
  });

  assert.equal(payload.year, '2025');
  assert.equal(typeof payload.title, 'string');
  assert.ok(Array.isArray(payload.categories), 'categories should be an array');
  assert.equal(payload.categories.length > 0, true, 'awards should include categories');

  const manifestEvents = diagnostics.entries.map(entry => entry.type);
  assert.equal(
    manifestEvents.includes('manifest:success'),
    true,
    'expected manifest lookup to succeed'
  );

  const bestBook = payload.categories.find(category => category.category === 'Best Book');
  assert.ok(bestBook, 'Best Book category should be present');
  assert.deepEqual(bestBook.nominations, [
    '<i>The Book of Doors</i>',
    '<i>Sunrise on the Reaping</i>',
    '<i>Briardark</i>',
    '<i>Mickey7</i>'
  ]);
  assert.equal(bestBook.winner, '<i>The Book of Doors</i>');
  assert.equal(bestBook.runnerUp, '<i>Sunrise on the Reaping</i>');

  const bestCharacter = payload.categories.find(category => category.category === 'Best Character');
  assert.ok(bestCharacter, 'Best Character category should be present');
  assert.deepEqual(bestCharacter.nominations, [
    'Cassie Andrews (<i>Book of Doors</i>)',
    'Haymitch (<i>Sunrise on the Reaping</i>)',
    'Izzy (<i>The Unmaking of June Farrow</i>)',
    'Mickey Barnes'
  ]);

  const supportingCharacter = payload.categories.find(category => category.category === 'Supporting Character');
  assert.ok(supportingCharacter, 'Supporting Character category should be present');
  assert.ok(
    supportingCharacter.nominations.includes('Min (<i>the Rook</i>)'),
    'Min (the Rook) should be highlighted in Supporting Character nominations'
  );

  const overlayEvents = diagnostics.entries.map(entry => entry.type).filter(type => type.startsWith('overlay'));
  assert.ok(
    overlayEvents.includes('overlay:success'),
    `expected overlay:success event, saw ${overlayEvents.join(', ')}`
  );
});

test('loadAwardsData retries manifest lookup paths before resolving canonical data', async () => {
  const attempts = [];

  async function fallbackFetch(resource) {
    attempts.push(resource);
    if (resource.startsWith('../years/')) {
      return { ok: false, status: 404 };
    }
    if (resource.startsWith('./years/')) {
      if (resource.endsWith('canonical-nominations.json')) {
        return { ok: false, status: 404 };
      }
      return fileFetch(resource.replace(/^\.\//, ''));
    }
    if (resource === 'years/canonical-nominations.json') {
      return fileFetch(resource);
    }
    if (resource === 'years/2025/nominations/2025-award-nominations.json') {
      return fileFetch(resource);
    }
    if (resource === 'years/2025/reveal/awards.json') {
      return fileFetch(resource);
    }
    throw new Error(`Unexpected resource request: ${resource}`);
  }

  const payload = await loader.loadAwardsData({
    year: '2025',
    fetchImpl: fallbackFetch
  });

  assert.equal(attempts[0], '../years/canonical-nominations.json');
  assert.ok(
    attempts.some(candidate => candidate.includes('years/canonical-nominations.json')),
    `Expected manifest lookup attempts, saw ${attempts.join(', ')}`
  );
  assert.ok(
    attempts.includes('years/2025/nominations/2025-award-nominations.json'),
    `Expected canonical nominations fetch, saw ${attempts.join(', ')}`
  );
  assert.ok(
    attempts.some(candidate => candidate.endsWith('/2025/reveal/awards.json')),
    `Expected awards overlay fetch, saw ${attempts.join(', ')}`
  );
  assert.equal(payload.year, '2025');
  assert.equal(payload.categories.length > 0, true);
  const winners = payload.categories.map(category => category.winner).filter(Boolean);
  assert.ok(winners.length > 0, 'expected at least one winner after overlay');
});

test('loadAwardsData falls back to an XMLHttpRequest implementation when fetch fails', async () => {
  let attempts = 0;
  async function failingFetch() {
    attempts += 1;
    throw new TypeError('Failed to fetch');
  }

  const payload = await loader.loadAwardsData({
    year: '2025',
    fetchImpl: failingFetch,
    xhrImpl: createFileBackedXhrFactory()
  });

  assert.equal(attempts > 0, true, 'expected the failing fetch to be invoked');
  assert.equal(payload.year, '2025');
  assert.equal(payload.categories.length > 0, true);
  const bookCategory = payload.categories.find(category => category.category === 'Best Book');
  assert.ok(bookCategory, 'Best Book category should be present');
  assert.equal(bookCategory.winner, '<i>The Book of Doors</i>');
});

test('loadAwardsData bypasses fetch on file protocol and resolves via XHR fallback', async () => {
  const originalFetch = global.fetch;
  const originalLocation = global.location;
  let fetchCallCount = 0;

  const hangingFetch = () => {
    fetchCallCount += 1;
    return new Promise(() => {});
  };

  global.fetch = hangingFetch;
  global.location = { protocol: 'file:' };

  try {
    const payload = await loader.loadAwardsData({
      year: '2025',
      xhrImpl: createFileBackedXhrFactory()
    });

    assert.equal(fetchCallCount, 0, 'fetch should be bypassed on file:// origins');
    assert.equal(payload.year, '2025');
    assert.equal(payload.categories.length > 0, true);
    const highlighted = payload.categories.find(category => category.category === 'Best Book');
    assert.ok(highlighted, 'Best Book category should be present');
    assert.equal(highlighted.winner, '<i>The Book of Doors</i>');
  } finally {
    if (typeof originalFetch === 'undefined') {
      delete global.fetch;
    } else {
      global.fetch = originalFetch;
    }

    if (typeof originalLocation === 'undefined') {
      delete global.location;
    } else {
      global.location = originalLocation;
    }
  }
});

test('createDiagnosticsChannel records entries and formats readable output', () => {
  const channel = loader.createDiagnosticsChannel();
  const sampleError = new Error('boom');
  channel.log('sample:event', { value: 3, nested: { ok: true }, err: sampleError, ignore: undefined });

  assert.equal(channel.entries.length, 1);
  const entry = channel.entries[0];
  assert.equal(entry.type, 'sample:event');
  assert.deepEqual(entry.details, { value: 3, nested: { ok: true }, err: 'boom' });

  const formatted = channel.toString();
  assert.equal(typeof formatted, 'string');
  assert.equal(formatted.includes('sample:event'), true);
  assert.equal(formatted.includes('value=3'), true);

  channel.clear();
  assert.equal(channel.entries.length, 0);
});

test('loadAwardsData emits diagnostics for successful fetch resolution', async () => {
  const channel = loader.createDiagnosticsChannel();
  const payload = await loader.loadAwardsData({
    year: '2025',
    basePath: 'years',
    fetchImpl: fileFetch,
    diagnostics: channel
  });

  assert.equal(payload.year, '2025');
  const eventTypes = channel.entries.map(entry => entry.type);
  assert.equal(eventTypes.includes('load:start'), true, 'expected load:start event');
  assert.equal(eventTypes.includes('manifest:success'), true, 'expected manifest success event');
  assert.equal(eventTypes.includes('load:complete'), true, 'expected load:complete event');
  assert.equal(eventTypes.includes('overlay:success'), true, 'expected overlay:success event');
});

test('loadAwardsData uses embedded manifest metadata when all network strategies fail', async () => {
  const channel = loader.createDiagnosticsChannel();
  const embeddedData = {
    '2025': {
      year: '2025',
      title: 'Embedded canonical fallback',
      categories: [
        {
          category: 'Embedded Category',
          nominations: ['Embedded Nominee'],
          winner: '',
          runnerUp: ''
        }
      ]
    }
  };

  const payload = await loader.loadAwardsData({
    year: '2025',
    fetchImpl: async () => {
      throw new Error('fetch disabled');
    },
    xhrImpl: () => ({
      open() {
        throw new Error('XHR disabled');
      }
    }),
    diagnostics: channel,
    embeddedData
  });

  assert.equal(payload.year, '2025');
  assert.equal(payload.title, 'Embedded canonical fallback');
  assert.deepEqual(payload.categories[0], {
    category: 'Embedded Category',
    nominations: ['Embedded Nominee'],
    winner: '',
    runnerUp: ''
  });

  const types = channel.entries.map(entry => entry.type);
  assert.equal(types.includes('load:embedded-success'), true);
  assert.equal(types.includes('load:failure'), false);
});

test('loadAwardsData consumes embedded awards snapshot when network strategies are unavailable', async () => {
  const snapshot = embeddedCatalog.get('2025');
  assert.ok(snapshot && snapshot.data && Array.isArray(snapshot.data.categories));

  const originalGlobal = global.AwardsEmbeddedData;
  global.AwardsEmbeddedData = embeddedCatalog;

  try {
    const payload = await loader.loadAwardsData({
      year: '2025',
      fetchImpl: async () => {
        throw new Error('fetch disabled');
      },
      xhrImpl: () => {
        return {
          open() {
            throw new Error('XHR disabled');
          }
        };
      }
    });

    assert.deepEqual(payload, loader.normalizeAwardsData(snapshot.data));
  } finally {
    if (typeof originalGlobal === 'undefined') {
      delete global.AwardsEmbeddedData;
    } else {
      global.AwardsEmbeddedData = originalGlobal;
    }
  }
});

test('loadAwardsData respects disableEmbedded to bypass global snapshots', async () => {
  const originalGlobal = global.AwardsEmbeddedData;
  const staleSnapshot = {
    manifestBase: 'years',
    get() {
      return {
        base: 'years',
        path: '2025/nominations/2025-award-nominations.json',
        format: 'normalized-nominations',
        title: 'Stale embedded data',
        data: {
          year: '2025',
          title: 'Outdated Snapshot',
          categories: [
            {
              category: 'Test Category',
              nominations: ['Outdated Entry'],
              winner: '',
              runnerUp: ''
            }
          ]
        }
      };
    }
  };

  global.AwardsEmbeddedData = staleSnapshot;

  try {
    const payload = await loader.loadAwardsData({
      year: '2025',
      basePath: 'years',
      fetchImpl: fileFetch,
      disableEmbedded: true
    });

    assert.equal(payload.year, '2025');
    assert.notEqual(payload.title, 'Outdated Snapshot');
    const categories = payload.categories.map(category => category.category);
    assert.ok(categories.includes('Best Book'), 'canonical categories should be present');
  } finally {
    if (typeof originalGlobal === 'undefined') {
      delete global.AwardsEmbeddedData;
    } else {
      global.AwardsEmbeddedData = originalGlobal;
    }
  }
});

test('embedded awards snapshot stays aligned with canonical manifest for 2025', async () => {
  const canonical = await loader.loadAwardsData({
    year: '2025',
    basePath: 'years',
    fetchImpl: fileFetch
  });

  const snapshot = embeddedCatalog.get('2025');
  assert.ok(snapshot && snapshot.data, 'expected embedded snapshot for 2025');

  assert.deepEqual(loader.normalizeAwardsData(snapshot.data), canonical);
});

test('loadAwardsData logs failures when no strategy succeeds', async () => {
  const channel = loader.createDiagnosticsChannel();

  await assert.rejects(
    loader.loadAwardsData({
      year: '1999',
      basePath: 'years',
      fetchImpl: async resource => {
        return { ok: false, status: 404, resource };
      },
      xhrImpl: () => {
        return {
          open() {
            throw new Error('XHR disabled');
          }
        };
      },
      diagnostics: channel
    })
  );

  const types = channel.entries.map(entry => entry.type);
  assert.equal(types.includes('load:failure'), true, 'expected load:failure event');
  assert.equal(
    types.filter(type => type === 'load:resource').length > 0,
    true,
    'expected at least one resource attempt'
  );
});
