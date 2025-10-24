(function (global, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    global.BackgroundWords = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function toPlainText(value) {
    if (typeof value !== 'string') {
      return '';
    }
    return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  function normalizeYear(value) {
    const stringValue = String(value ?? '').trim();
    if (!stringValue) {
      return null;
    }
    const numeric = Number.parseInt(stringValue, 10);
    if (!Number.isFinite(numeric)) {
      return null;
    }
    return numeric;
  }

  function collectWordsFromAwards(options) {
    const { awardsByYear, maxYear } = options || {};
    const limitYear = normalizeYear(maxYear);
    if (!Number.isFinite(limitYear)) {
      return [];
    }

    const entries = awardsByYear instanceof Map
      ? Array.from(awardsByYear.entries())
      : awardsByYear && typeof awardsByYear === 'object'
        ? Object.entries(awardsByYear)
        : [];

    const terms = new Set();

    entries.forEach(([yearKey, payload]) => {
      const numericYear = normalizeYear(yearKey);
      if (!Number.isFinite(numericYear) || numericYear > limitYear) {
        return;
      }

      if (!payload || typeof payload !== 'object') {
        return;
      }

      const categories = Array.isArray(payload.categories) ? payload.categories : [];
      categories.forEach(entry => {
        if (!entry || typeof entry !== 'object') {
          return;
        }

        const categoryName = toPlainText(entry.category || entry.name);
        if (categoryName) {
          terms.add(categoryName);
        }

        const nominations = Array.isArray(entry.nominations) ? entry.nominations : [];
        nominations.forEach(nomination => {
          const text = toPlainText(nomination);
          if (text) {
            terms.add(text);
          }
        });

        const winner = toPlainText(entry.winner);
        if (winner) {
          terms.add(winner);
        }

        const runnerUp = toPlainText(entry.runnerUp);
        if (runnerUp) {
          terms.add(runnerUp);
        }
      });
    });

    return Array.from(terms);
  }

  return {
    collectWordsFromAwards
  };
});
