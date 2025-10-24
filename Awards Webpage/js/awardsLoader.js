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

  async function loadAwardsData(options) {
    const { year, basePath, fetchImpl } = options || {};

    if (!year) {
      throw new TypeError('A year is required to load awards data.');
    }

    const fetchFn = fetchImpl || (typeof fetch === 'function' ? fetch : null);
    if (!fetchFn) {
      throw new Error('No fetch implementation available.');
    }

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
        const response = await fetchFn(resource);
        if (!response || !response.ok) {
          lastError = new Error(`Unable to load awards data for ${year} from ${resource}.`);
          continue;
        }
        const raw = await response.json();
        return normalizeAwardsData(raw);
      } catch (error) {
        lastError = error;
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
