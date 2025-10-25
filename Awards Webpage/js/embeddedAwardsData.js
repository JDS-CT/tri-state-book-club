(function (global, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    global.AwardsEmbeddedData = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const manifestBase = 'years';
  const manifestByYear = {
    '2023': {
      base: manifestBase,
      path: '2023/nominations/joshua-2023-ballot.json',
      format: 'ballot',
      title: '2023 Tri-State Book Club Awards — Joshua ballot reconstruction'
    },
    '2024': {
      base: manifestBase,
      path: '2024/nominations/2024-award-nominations.json',
      format: 'category-counts',
      title: '2024 Tri-State Book Club Awards Nominations'
    },
    '2025': {
      base: manifestBase,
      path: '2025/nominations/2025-award-nominations.json',
      format: 'normalized-nominations',
      title: '2025 Tri-State Book Club Awards Nominations'
    }
  };

  function get(year) {
    const key = String(year);
    if (Object.prototype.hasOwnProperty.call(manifestByYear, key)) {
      return manifestByYear[key];
    }
    const numeric = Number.parseInt(key, 10);
    if (Number.isFinite(numeric) && Object.prototype.hasOwnProperty.call(manifestByYear, numeric)) {
      return manifestByYear[numeric];
    }
    return null;
  }

  return {
    manifestBase,
    byYear: manifestByYear,
    get
  };
});
