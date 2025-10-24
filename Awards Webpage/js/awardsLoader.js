(function (global, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    global.AwardsLoader = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function ensureArray(value) {
    if (Array.isArray(value)) {
      return value.slice();
    }
    if (value === undefined || value === null) {
      return [];
    }
    throw new TypeError('Expected nominations to be an array.');
  }

  function normalizeAwardsData(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new TypeError('awards.json must be an object.');
    }

    const categories = raw.categories;
    if (!Array.isArray(categories)) {
      throw new TypeError('awards.json must include a categories array.');
    }

    const normalized = categories.map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        throw new TypeError(`Category at index ${index} must be an object.`);
      }

      const name = entry.category || entry.name;
      if (!name) {
        throw new TypeError(`Category at index ${index} is missing a category name.`);
      }

      return {
        category: name,
        nominations: ensureArray(entry.nominations),
        winner: entry.winner || '',
        runnerUp: entry.runnerUp || ''
      };
    });

    return {
      year: raw.year || '',
      title: raw.title || '',
      categories: normalized
    };
  }

  function buildResourcePath(base, year) {
    const sanitizedBase = (base || '').replace(/\/?$/, '');
    if (!sanitizedBase) {
      return `/${year}/reveal/awards.json`;
    }
    return `${sanitizedBase}/${year}/reveal/awards.json`;
  }

  function shouldBypassFetch(options) {
    if (options && Object.prototype.hasOwnProperty.call(options, 'fetchImpl')) {
      return false;
    }

    let locationLike = null;
    if (options && options.location && typeof options.location === 'object') {
      locationLike = options.location;
    } else if (typeof globalThis !== 'undefined' && typeof globalThis.location === 'object') {
      locationLike = globalThis.location;
    }

    if (!locationLike || typeof locationLike.protocol !== 'string') {
      return false;
    }

    return locationLike.protocol.toLowerCase() === 'file:';
  }

  function resolveFetchImplementation(options) {
    if (options && typeof options.fetchImpl === 'function') {
      return options.fetchImpl;
    }

    if (shouldBypassFetch(options)) {
      return null;
    }

    return typeof fetch === 'function' ? fetch : null;
  }

  function resolveXhrFactory(options) {
    if (options && typeof options.xhrImpl === 'function') {
      return options.xhrImpl;
    }
    if (typeof XMLHttpRequest !== 'undefined') {
      return () => new XMLHttpRequest();
    }
    return null;
  }

  function parseJsonPayload(text) {
    if (typeof text !== 'string') {
      throw new Error('Expected awards data to be text.');
    }
    return JSON.parse(text);
  }

  function createDiagnosticsChannel(listener) {
    const entries = [];

    function sanitizeDetails(details) {
      if (!details || typeof details !== 'object') {
        return {};
      }
      return Object.keys(details).reduce((accumulator, key) => {
        const value = details[key];
        if (value === undefined) {
          return accumulator;
        }
        if (value instanceof Error) {
          accumulator[key] = value.message;
          return accumulator;
        }
        if (typeof value === 'object' && value !== null) {
          try {
            accumulator[key] = JSON.parse(JSON.stringify(value));
          } catch (_) {
            accumulator[key] = String(value);
          }
          return accumulator;
        }
        accumulator[key] = value;
        return accumulator;
      }, {});
    }

    const channel = {
      entries,
      onEvent: typeof listener === 'function' ? listener : null,
      log(type, details) {
        const entry = {
          timestamp: new Date().toISOString(),
          type: String(type || 'unknown'),
          details: sanitizeDetails(details)
        };
        entries.push(entry);
        if (typeof channel.onEvent === 'function') {
          try {
            channel.onEvent(entry);
          } catch (error) {
            if (typeof console !== 'undefined' && typeof console.error === 'function') {
              console.error('Diagnostics listener failed:', error);
            }
          }
        }
        return entry;
      },
      clear() {
        entries.length = 0;
      },
      snapshot() {
        return entries.slice();
      },
      toString() {
        return entries
          .map(entry => {
            const detailKeys = Object.keys(entry.details);
            const serializedDetails = detailKeys.length
              ? detailKeys
                  .map(key => `${key}=${JSON.stringify(entry.details[key])}`)
                  .join(', ')
              : 'no-details';
            return `[${entry.timestamp}] ${entry.type} — ${serializedDetails}`;
          })
          .join('\n');
      }
    };

    return channel;
  }

  function resolveDiagnostics(input) {
    if (!input) {
      return { log() {} };
    }
    if (typeof input.log === 'function') {
      return input;
    }
    if (typeof input === 'function') {
      return { log: input };
    }
    return { log() {} };
  }

  async function loadViaFetch(resource, fetchFn, diagnostics) {
    diagnostics.log('fetch:request', { resource });
    const response = await fetchFn(resource);
    if (!response || !response.ok) {
      const error = new Error(`Unable to load awards data from ${resource}.`);
      diagnostics.log('fetch:error', { resource, status: response && response.status });
      throw error;
    }
    const raw = await response.json();
    const normalized = normalizeAwardsData(raw);
    diagnostics.log('fetch:success', {
      resource,
      categories: normalized.categories.length
    });
    return normalized;
  }

  function loadViaXhr(resource, xhrFactory, diagnostics) {
    diagnostics.log('xhr:request', { resource });
    return new Promise((resolve, reject) => {
      let xhr;
      try {
        xhr = xhrFactory();
      } catch (error) {
        diagnostics.log('xhr:factory-error', { resource, error });
        reject(error);
        return;
      }

      if (!xhr) {
        diagnostics.log('xhr:factory-null', { resource });
        reject(new Error('Unable to create an XMLHttpRequest instance.'));
        return;
      }

      try {
        xhr.open('GET', resource, true);
      } catch (error) {
        diagnostics.log('xhr:open-error', { resource, error });
        reject(error);
        return;
      }

      if ('responseType' in xhr) {
        xhr.responseType = 'text';
      }
      if (typeof xhr.overrideMimeType === 'function') {
        xhr.overrideMimeType('application/json');
      }

      xhr.onload = function onload() {
        const status = typeof xhr.status === 'number' ? xhr.status : 0;
        const body = typeof xhr.responseText === 'string' ? xhr.responseText : xhr.response;

        if ((status >= 200 && status < 300) || (status === 0 && body)) {
          try {
            const raw = parseJsonPayload(body);
            const normalized = normalizeAwardsData(raw);
            diagnostics.log('xhr:success', {
              resource,
              categories: normalized.categories.length
            });
            resolve(normalized);
          } catch (error) {
            diagnostics.log('xhr:parse-error', { resource, error });
            reject(error);
          }
          return;
        }

        diagnostics.log('xhr:http-error', { resource, status });
        reject(new Error(`Unable to load awards data from ${resource}.`));
      };

      xhr.onerror = function onerror(event) {
        const error = event instanceof Error ? event : new Error(`Request failed for ${resource}.`);
        diagnostics.log('xhr:network-error', { resource, error });
        reject(error);
      };

      try {
        xhr.send();
      } catch (error) {
        diagnostics.log('xhr:send-error', { resource, error });
        reject(error);
      }
    });
  }

  async function loadAwardsData(options) {
    const { year, basePath } = options || {};

    if (!year) {
      throw new TypeError('A year is required to load awards data.');
    }

    const diagnostics = resolveDiagnostics(options && options.diagnostics);
    diagnostics.log('load:start', { year, basePath });

    const fetchFn = resolveFetchImplementation(options);
    const xhrFactory = resolveXhrFactory(options);

    diagnostics.log('load:strategies', {
      fetch: Boolean(fetchFn),
      xhr: Boolean(xhrFactory),
      fileBypass: shouldBypassFetch(options)
    });

    const candidates = [];
    const pushCandidate = value => {
      if (!value && value !== '') {
        return;
      }
      if (!candidates.includes(value)) {
        candidates.push(value);
      }
    };

    if (basePath !== undefined) {
      pushCandidate(basePath);
    }
    ['../years', './years', 'years'].forEach(pushCandidate);

    let lastError = null;
    for (const candidate of candidates) {
      const resource = buildResourcePath(candidate, year);
      diagnostics.log('load:resource', { resource });
      try {
        if (fetchFn) {
          const result = await loadViaFetch(resource, fetchFn, diagnostics);
          diagnostics.log('load:complete', { strategy: 'fetch', resource });
          return result;
        }
      } catch (error) {
        diagnostics.log('load:fetch-error', { resource, message: error && error.message });
        lastError = error;
      }

      if (xhrFactory) {
        try {
          const result = await loadViaXhr(resource, xhrFactory, diagnostics);
          diagnostics.log('load:complete', { strategy: 'xhr', resource });
          return result;
        } catch (error) {
          diagnostics.log('load:xhr-error', { resource, message: error && error.message });
          lastError = error;
        }
      }
    }

    if (lastError) {
      diagnostics.log('load:failure', { year, message: lastError.message });
      throw lastError;
    }
    const finalError = new Error(`Unable to load awards data for ${year}.`);
    diagnostics.log('load:failure', { year, message: finalError.message });
    throw finalError;
  }

  return {
    normalizeAwardsData,
    loadAwardsData,
    createDiagnosticsChannel
  };
});
