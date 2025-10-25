/* 2025 awards data is loaded dynamically from years/2025/nominations/2025-award-nominations.json.
   This stub exists for legacy integrations that expected a global array. */
(function (global) {
  function loadFromLoader() {
    if (!global || !global.AwardsLoader || typeof global.AwardsLoader.loadAwardsData !== 'function') {
      throw new Error('AwardsLoader.loadAwardsData is required to load 2025 awards.');
    }
    return global.AwardsLoader.loadAwardsData({ year: '2025' });
  }

  function attachLegacyShim() {
    try {
      const promise = loadFromLoader();
      if (promise && typeof promise.then === 'function') {
        promise.then(payload => {
          if (payload && Array.isArray(payload.categories)) {
            global.awards = payload.categories;
          }
        }).catch(() => {
          /* intentionally swallow errors: legacy scripts should rely on diagnostics */
        });
      }
      return promise;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = attachLegacyShim;
  } else {
    global.loadAwards2025 = attachLegacyShim;
  }
})(typeof self !== 'undefined' ? self : this);
