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

  async function loadViaFetch(resource, fetchFn) {
    const response = await fetchFn(resource);
    if (!response || !response.ok) {
      throw new Error(`Unable to load awards data from ${resource}.`);
    }
    const raw = await response.json();
    return normalizeAwardsData(raw);
  }

  function loadViaXhr(resource, xhrFactory) {
    return new Promise((resolve, reject) => {
      let xhr;
      try {
        xhr = xhrFactory();
      } catch (error) {
        reject(error);
        return;
      }

      if (!xhr) {
        reject(new Error('Unable to create an XMLHttpRequest instance.'));
        return;
      }

      try {
        xhr.open('GET', resource, true);
      } catch (error) {
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
            resolve(normalizeAwardsData(raw));
          } catch (error) {
            reject(error);
          }
          return;
        }

        reject(new Error(`Unable to load awards data from ${resource}.`));
      };

      xhr.onerror = function onerror(event) {
        const error = event instanceof Error ? event : new Error(`Request failed for ${resource}.`);
        reject(error);
      };

      try {
        xhr.send();
      } catch (error) {
        reject(error);
      }
    });
  }

  async function loadAwardsData(options) {
    const { year, basePath } = options || {};

    if (!year) {
      throw new TypeError('A year is required to load awards data.');
    }

    const fetchFn = resolveFetchImplementation(options);
    const xhrFactory = resolveXhrFactory(options);

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
      try {
        if (fetchFn) {
          return await loadViaFetch(resource, fetchFn);
        }
      } catch (error) {
        lastError = error;
      }

      if (xhrFactory) {
        try {
          return await loadViaXhr(resource, xhrFactory);
        } catch (error) {
          lastError = error;
        }
      }
    }

    if (lastError) {
      throw lastError;
    }
    throw new Error(`Unable to load awards data for ${year}.`);
  }

  return {
    normalizeAwardsData,
    loadAwardsData
  };
});
