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

  async function loadAwardsData(options) {
    const { year, basePath = '../years', fetchImpl } = options || {};

    if (!year) {
      throw new TypeError('A year is required to load awards data.');
    }

    const fetchFn = fetchImpl || (typeof fetch === 'function' ? fetch : null);
    if (!fetchFn) {
      throw new Error('No fetch implementation available.');
    }

    const sanitizedBase = basePath.replace(/\/?$/, '');
    const resource = `${sanitizedBase}/${year}/reveal/awards.json`;
    const response = await fetchFn(resource);

    if (!response || !response.ok) {
      throw new Error(`Unable to load awards data for ${year} from ${resource}.`);
    }

    const raw = await response.json();
    return normalizeAwardsData(raw);
  }

  return {
    normalizeAwardsData,
    loadAwardsData
  };
});
