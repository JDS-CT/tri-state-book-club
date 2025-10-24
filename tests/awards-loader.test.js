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

test('loadAwardsData falls back to an XMLHttpRequest implementation when fetch fails', async () => {
  let attempts = 0;
  async function failingFetch() {
    attempts += 1;
    throw new TypeError('Failed to fetch');
  }

  const payload = await loader.loadAwardsData({
    year: '2024',
    fetchImpl: failingFetch,
    xhrImpl: createFileBackedXhrFactory()
  });

  assert.equal(attempts > 0, true, 'expected the failing fetch to be invoked');
  assert.equal(payload.year, '2024');
  assert.equal(payload.categories.length > 0, true);
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
      year: '2024',
      xhrImpl: createFileBackedXhrFactory()
    });

    assert.equal(fetchCallCount, 0, 'fetch should be bypassed on file:// origins');
    assert.equal(payload.year, '2024');
    assert.equal(payload.categories.length > 0, true);
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
    year: '2024',
    basePath: 'years',
    fetchImpl: fileFetch,
    diagnostics: channel
  });

  assert.equal(payload.year, '2024');
  const eventTypes = channel.entries.map(entry => entry.type);
  assert.equal(eventTypes.includes('load:start'), true, 'expected load:start event');
  assert.equal(eventTypes.includes('fetch:success'), true, 'expected fetch:success event');
  assert.equal(eventTypes.includes('load:complete'), true, 'expected load:complete event');
});

test('loadAwardsData uses embedded data when network strategies fail', async () => {
  const channel = loader.createDiagnosticsChannel();
  const embeddedData = {
    '2024': {
      year: '2024',
      title: 'Embedded fallback awards',
      categories: [
        {
          category: 'Embedded Category',
          nominations: ['Fallback Nominee'],
          winner: 'Fallback Winner',
          runnerUp: 'Fallback Runner-up'
        }
      ]
    }
  };

  const payload = await loader.loadAwardsData({
    year: '2024',
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

  assert.equal(payload.year, '2024');
  assert.equal(payload.title, 'Embedded fallback awards');
  assert.deepEqual(payload.categories[0], {
    category: 'Embedded Category',
    nominations: ['Fallback Nominee'],
    winner: 'Fallback Winner',
    runnerUp: 'Fallback Runner-up'
  });

  const types = channel.entries.map(entry => entry.type);
  assert.equal(types.includes('load:embedded-success'), true);
  assert.equal(types.includes('load:failure'), false);
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
