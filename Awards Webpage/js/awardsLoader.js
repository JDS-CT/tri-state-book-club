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

  function buildManifestPath(base, manifestName = 'canonical-nominations.json') {
    const sanitizedBase = (base || '').replace(/\/?$/, '');
    if (!sanitizedBase) {
      return `/${manifestName}`;
    }
    return `${sanitizedBase}/${manifestName}`;
  }

  function joinResource(base, relativePath) {
    const sanitizedBase = (base || '').replace(/\/?$/, '');
    const normalizedRelative = String(relativePath || '').replace(/^\/?/, '');
    if (!sanitizedBase) {
      return normalizedRelative;
    }
    if (!normalizedRelative) {
      return sanitizedBase;
    }
    return `${sanitizedBase}/${normalizedRelative}`;
  }

  const BOOK_CATEGORY_IDS = new Set([
    'best-book',
    'worst-book',
    'original-concept',
    'most-anticipated-before-reading',
    'best-book-all-time',
    'book-to-re-read'
  ]);

  const BOOK_CATEGORY_PATTERNS = [
    /\bbest book\b/i,
    /\bworst book\b/i,
    /\bbook of all time\b/i,
    /\bbook to re-read\b/i,
    /\bmost anticipated\b/i,
    /\boriginal concept\b/i
  ];

  function isBookCategoryMeta(meta) {
    if (!meta) {
      return false;
    }
    if (meta.id && BOOK_CATEGORY_IDS.has(String(meta.id))) {
      return true;
    }
    const label = String(meta.label || meta.category || '').toLowerCase();
    if (!label) {
      return false;
    }
    if (label.includes('book club moment')) {
      return false;
    }
    return BOOK_CATEGORY_PATTERNS.some(pattern => pattern.test(label));
  }

  function italicizeParentheticals(value) {
    if (typeof value !== 'string') {
      return '';
    }
    return value.replace(/\(([^)]+)\)/g, function replace(match, inner) {
      const trimmed = String(inner || '').trim();
      if (!trimmed) {
        return match;
      }
      if (/<i>/i.test(match)) {
        return match;
      }
      return `(<i>${trimmed}</i>)`;
    });
  }

  function italicizeDashSuffix(value) {
    if (typeof value !== 'string') {
      return '';
    }
    if (/<i>/i.test(value)) {
      return value;
    }
    const dashMatch = value.match(/^(.*?)[\s]*[–-][\s]*(.+)$/);
    if (!dashMatch) {
      return value;
    }
    const left = dashMatch[1].trim();
    const right = dashMatch[2].trim();
    if (!left) {
      return `<i>${right}</i>`;
    }
    if (!right) {
      return left;
    }
    return `${left} (<i>${right}</i>)`;
  }

  function ensureItalicized(value, meta) {
    if (typeof value !== 'string') {
      return '';
    }
    let result = value.trim();
    if (!result) {
      return '';
    }

    if (isBookCategoryMeta(meta) && !/<i>/i.test(result)) {
      return `<i>${result}</i>`;
    }

    result = italicizeParentheticals(result);
    result = italicizeDashSuffix(result);
    return result;
  }

  function detailScore(value) {
    if (typeof value !== 'string') {
      return 0;
    }
    let score = 0;
    if (/[()]/.test(value)) {
      score += 3;
    }
    if (/[–-]/.test(value)) {
      score += 2;
    }
    if (/<i>/i.test(value)) {
      score += 1;
    }
    if (/\bthe\b/i.test(value)) {
      score += 1;
    }
    if (value.length > 24) {
      score += 1;
    }
    return score;
  }

  function sortByDetail(values) {
    if (!Array.isArray(values)) {
      return [];
    }
    return values
      .map(value => String(value))
      .sort((a, b) => {
        const scoreDiff = detailScore(b) - detailScore(a);
        if (scoreDiff !== 0) {
          return scoreDiff;
        }
        if (b.length !== a.length) {
          return b.length - a.length;
        }
        return a.localeCompare(b);
      });
  }

  function defaultTitleForYear(year) {
    if (!year) {
      return 'Book Club Awards';
    }
    return `${year} Tri-State Book Club Awards`;
  }

  function deriveNormalizedDisplay(nomination, categoryMeta) {
    if (!nomination || typeof nomination !== 'object') {
      return '';
    }

    if (typeof nomination.display_html === 'string' && nomination.display_html.trim()) {
      return ensureItalicized(nomination.display_html, categoryMeta);
    }

    const meta = nomination || {};
    const primary = [];
    const aliases = [];
    const mentions = [];

    if (Array.isArray(meta.aliases)) {
      sortByDetail(meta.aliases).forEach(alias => {
        if (alias) {
          aliases.push(String(alias));
        }
      });
    }

    if (Array.isArray(meta.mentions)) {
      const mentionValues = meta.mentions
        .map(mention => (mention && typeof mention.raw_text === 'string' ? mention.raw_text : null))
        .filter(Boolean);
      sortByDetail(mentionValues).forEach(value => {
        mentions.push(String(value));
      });
    }

    ['display_name', 'displayName', 'name', 'title'].forEach(key => {
      if (meta[key]) {
        primary.push(String(meta[key]));
      }
    });

    const labelCandidates = isBookCategoryMeta(categoryMeta)
      ? primary.concat(aliases, mentions)
      : aliases.concat(mentions, primary);

    let bestCandidate = '';
    let bestScore = -Infinity;

    for (const candidate of labelCandidates) {
      const formatted = ensureItalicized(candidate, categoryMeta);
      if (!formatted) {
        continue;
      }
      const score = detailScore(formatted);
      if (score > bestScore) {
        bestCandidate = formatted;
        bestScore = score;
      }
    }

    return bestCandidate;
  }

  function normalizeNominationList(rawList, categoryMeta) {
    if (!Array.isArray(rawList)) {
      return [];
    }
    const results = [];
    rawList.forEach(nomination => {
      const formatted = deriveNormalizedDisplay(nomination, categoryMeta);
      if (formatted) {
        results.push(formatted);
      }
    });
    return results;
  }

  function transformNormalizedNominations(raw, context) {
    if (!raw || typeof raw !== 'object') {
      throw new TypeError('normalized nominations file must be an object');
    }

    const categories = Array.isArray(raw.categories) ? raw.categories : [];
    const transformed = categories.map(category => {
      const label = category.label || category.prompt || category.name || category.category || category.id;
      const nominations = normalizeNominationList(category.nominations || [], category);
      return {
        category: label || '',
        nominations,
        winner: '',
        runnerUp: ''
      };
    });

    const resolvedYear = String(raw.season || raw.year || context.year || '');
    return {
      year: resolvedYear,
      title: raw.title || context.title || defaultTitleForYear(context.year || resolvedYear),
      categories: transformed
    };
  }

  function transformCategoryCounts(raw, context) {
    if (!raw || typeof raw !== 'object' || typeof raw.nominations !== 'object') {
      throw new TypeError('category counts file must include a nominations object');
    }

    const categories = Object.keys(raw.nominations).map(categoryName => {
      const entries = raw.nominations[categoryName] || {};
      const sorted = Object.keys(entries)
        .map(name => ({ name, count: Number(entries[name]) || 0 }))
        .sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count;
          }
          return a.name.localeCompare(b.name);
        })
        .map(entry => ensureItalicized(entry.name, { category: categoryName }))
        .filter(Boolean);

      return {
        category: categoryName,
        nominations: sorted,
        winner: '',
        runnerUp: ''
      };
    });

    const resolvedYear = String(raw.year || context.year || '');
    return {
      year: resolvedYear,
      title: raw.title || context.title || defaultTitleForYear(context.year || resolvedYear),
      categories
    };
  }

  function transformBallot(raw, context) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.categories)) {
      throw new TypeError('ballot file must include a categories array');
    }

    const categories = raw.categories.map(category => {
      const label = category.name || category.category || '';
      const rankings = Array.isArray(category.rankings) ? category.rankings : [];
      const nominations = rankings
        .map(entry => {
          if (!entry || typeof entry !== 'object') {
            return '';
          }
          if (entry.title) {
            return ensureItalicized(entry.title, { category: label });
          }
          if (entry.name && entry.work) {
            return ensureItalicized(`${entry.name} (${entry.work})`, { category: label });
          }
          if (entry.description && entry.work) {
            return ensureItalicized(`${entry.description} (${entry.work})`, { category: label });
          }
          if (entry.description) {
            return ensureItalicized(entry.description, { category: label });
          }
          if (entry.name) {
            return ensureItalicized(entry.name, { category: label });
          }
          return '';
        })
        .filter(Boolean);

      return {
        category: label,
        nominations,
        winner: '',
        runnerUp: ''
      };
    });

    const resolvedYear = String(raw.year || context.year || '');
    return {
      year: resolvedYear,
      title: raw.title || context.title || defaultTitleForYear(context.year || resolvedYear),
      categories
    };
  }

  function transformCanonicalPayload(raw, entry, context) {
    const metadata = entry || {};
    const format = String(metadata.format || '').toLowerCase();
    const transformContext = {
      year: context.year,
      title: metadata.title || context.title
    };

    if (format === 'normalized-nominations' || format === 'normalized') {
      return transformNormalizedNominations(raw, transformContext);
    }
    if (format === 'category-counts' || format === 'counts') {
      return transformCategoryCounts(raw, transformContext);
    }
    if (format === 'ballot' || format === 'ranked-ballot') {
      return transformBallot(raw, transformContext);
    }
    if (Array.isArray(raw.categories)) {
      return normalizeAwardsData(raw);
    }
    throw new Error(`Unsupported canonical format: ${format || 'unknown'}`);
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


  function normalizeEmbeddedCandidate(candidate) {
    if (!candidate) {
      return null;
    }
    if (typeof candidate === 'function') {
      try {
        return normalizeEmbeddedCandidate(candidate());
      } catch (_) {
        return null;
      }
    }
    return candidate;
  }

  function resolveEmbeddedCatalog(options) {
    if (options && options.disableEmbedded) {
      return null;
    }

    if (options && Object.prototype.hasOwnProperty.call(options, 'embeddedData')) {
      const normalized = normalizeEmbeddedCandidate(options.embeddedData);
      if (normalized) {
        return { catalog: normalized, source: 'options' };
      }
      return null;
    }

    if (typeof globalThis !== 'undefined') {
      const globalCandidates = [
        globalThis.AwardsEmbeddedData,
        globalThis.EmbeddedAwardsData,
        globalThis.embeddedAwardsData,
        globalThis.AwardsData && globalThis.AwardsData.embedded
      ];

      for (const candidate of globalCandidates) {
        const normalized = normalizeEmbeddedCandidate(candidate);
        if (normalized) {
          return { catalog: normalized, source: 'global' };
        }
      }
    }

    return null;
  }

  function extractEmbeddedEntry(catalog, year) {
    if (!catalog) {
      return null;
    }

    const key = String(year);
    const alternateKeys = [key];
    if (typeof year === 'number' || /^(\d+)$/.test(key)) {
      const numeric = Number.parseInt(key, 10);
      if (Number.isFinite(numeric) && !alternateKeys.includes(numeric)) {
        alternateKeys.push(numeric);
      }
    }

    if (typeof catalog.get === 'function') {
      for (const candidateKey of alternateKeys) {
        try {
          const value = catalog.get(candidateKey);
          if (value !== undefined) {
            return value;
          }
        } catch (_) {
          // ignore lookup errors
        }
      }
    }

    if (typeof catalog.entries === 'function') {
      try {
        for (const entry of catalog.entries()) {
          if (!entry || typeof entry !== 'object') {
            continue;
          }
          const [entryKey, value] = Array.isArray(entry) ? entry : [entry.key, entry.value];
          if (alternateKeys.some(candidateKey => String(entryKey) === String(candidateKey))) {
            return value;
          }
        }
      } catch (_) {
        // ignore iteration errors
      }
    }

    if (catalog.data && typeof catalog.data === 'object') {
      const value = extractEmbeddedEntry(catalog.data, year);
      if (value !== null) {
        return value;
      }
    }

    if (catalog.byYear && typeof catalog.byYear === 'object') {
      const value = extractEmbeddedEntry(catalog.byYear, year);
      if (value !== null) {
        return value;
      }
    }

    for (const candidateKey of alternateKeys) {
      if (Object.prototype.hasOwnProperty.call(catalog, candidateKey)) {
        return catalog[candidateKey];
      }
    }

    return null;
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

  async function loadViaFetch(resource, fetchFn, diagnostics, transform, logContext, completeEvent) {
    const context = logContext || 'fetch';
    const transformer = typeof transform === 'function' ? transform : normalizeAwardsData;
    diagnostics.log(`${context}:request`, { resource });
    const response = await fetchFn(resource);
    if (!response || !response.ok) {
      const error = new Error(`Unable to load awards data from ${resource}.`);
      diagnostics.log(`${context}:error`, { resource, status: response && response.status });
      throw error;
    }
    const raw = await response.json();
    const normalized = transformer(raw);
    const details = { resource };
    if (normalized && typeof normalized === 'object' && Array.isArray(normalized.categories)) {
      details.categories = normalized.categories.length;
    }
    diagnostics.log(`${context}:success`, details);
    if (completeEvent) {
      diagnostics.log(completeEvent, { strategy: context, resource });
    }
    return normalized;
  }

  function loadViaXhr(resource, xhrFactory, diagnostics, transform, logContext, completeEvent) {
    const context = logContext || 'xhr';
    const transformer = typeof transform === 'function' ? transform : normalizeAwardsData;
    diagnostics.log(`${context}:request`, { resource });
    return new Promise((resolve, reject) => {
      let xhr;
      try {
        xhr = xhrFactory();
      } catch (error) {
        diagnostics.log(`${context}:factory-error`, { resource, error });
        reject(error);
        return;
      }

      if (!xhr) {
        diagnostics.log(`${context}:factory-null`, { resource });
        reject(new Error('Unable to create an XMLHttpRequest instance.'));
        return;
      }

      try {
        xhr.open('GET', resource, true);
      } catch (error) {
        diagnostics.log(`${context}:open-error`, { resource, error });
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
            const normalized = transformer(raw);
            const details = { resource };
            if (normalized && typeof normalized === 'object' && Array.isArray(normalized.categories)) {
              details.categories = normalized.categories.length;
            }
            diagnostics.log(`${context}:success`, details);
            if (completeEvent) {
              diagnostics.log(completeEvent, { strategy: context, resource });
            }
            resolve(normalized);
          } catch (error) {
            diagnostics.log(`${context}:parse-error`, { resource, error });
            reject(error);
          }
          return;
        }

        diagnostics.log(`${context}:http-error`, { resource, status });
        reject(new Error(`Unable to load awards data from ${resource}.`));
      };

      xhr.onerror = function onerror(event) {
        const error = event instanceof Error ? event : new Error(`Request failed for ${resource}.`);
        diagnostics.log(`${context}:network-error`, { resource, error });
        reject(error);
      };

      try {
        xhr.send();
      } catch (error) {
        diagnostics.log(`${context}:send-error`, { resource, error });
        reject(error);
      }
    });
  }

  function toManifestEntry(manifest, year) {
    if (!manifest || typeof manifest !== 'object') {
      return null;
    }
    const key = String(year);
    if (Object.prototype.hasOwnProperty.call(manifest, key)) {
      return manifest[key];
    }
    const numericYear = Number.parseInt(key, 10);
    if (Number.isFinite(numericYear) && Object.prototype.hasOwnProperty.call(manifest, numericYear)) {
      return manifest[numericYear];
    }
    return null;
  }

  async function loadCanonicalFromEntry(entry, options) {
    const { base, fetchFn, xhrFactory, diagnostics, year } = options;
    if (!entry || typeof entry !== 'object') {
      return null;
    }

    const relativePath = entry.path || entry.source || '';
    if (!relativePath) {
      throw new Error('Canonical manifest entry is missing a path.');
    }
    const resource = joinResource(base, relativePath);
    diagnostics.log('manifest:data-request', { resource, year });

    const transformer = raw => transformCanonicalPayload(raw, entry, { year, title: entry.title });
    let lastError = null;

    if (fetchFn) {
      try {
        const payload = await loadViaFetch(resource, fetchFn, diagnostics, transformer, 'canonical-fetch', 'load:complete');
        diagnostics.log('manifest:data-success', { resource, year });
        return payload;
      } catch (error) {
        lastError = error;
        diagnostics.log('manifest:data-fetch-error', { resource, message: error && error.message });
      }
    }

    if (xhrFactory) {
      try {
        const payload = await loadViaXhr(resource, xhrFactory, diagnostics, transformer, 'canonical-xhr', 'load:complete');
        diagnostics.log('manifest:data-success', { resource, year });
        return payload;
      } catch (error) {
        lastError = error;
        diagnostics.log('manifest:data-xhr-error', { resource, message: error && error.message });
      }
    }

    if (lastError) {
      throw lastError;
    }
    throw new Error(`Unable to resolve canonical data for ${year} from ${resource}.`);
  }

  async function attemptCanonicalLoad(candidates, options) {
    const { year, fetchFn, xhrFactory, diagnostics } = options;
    let manifest = null;
    let manifestBase = null;
    let lastError = null;

    for (const base of candidates) {
      const resource = buildManifestPath(base);
      diagnostics.log('manifest:resource', { resource });
      if (fetchFn) {
        try {
          manifest = await loadViaFetch(resource, fetchFn, diagnostics, value => value, 'manifest', null);
          manifestBase = base;
          diagnostics.log('manifest:success', { resource });
          break;
        } catch (error) {
          lastError = error;
          diagnostics.log('manifest:fetch-error', { resource, message: error && error.message });
        }
      }

      if (xhrFactory) {
        try {
          manifest = await loadViaXhr(resource, xhrFactory, diagnostics, value => value, 'manifest-xhr', null);
          manifestBase = base;
          diagnostics.log('manifest:success', { resource });
          break;
        } catch (error) {
          lastError = error;
          diagnostics.log('manifest:xhr-error', { resource, message: error && error.message });
        }
      }
    }

    if (!manifest) {
      if (lastError) {
        diagnostics.log('manifest:failure', { year, message: lastError.message });
      } else {
        diagnostics.log('manifest:failure', { year, message: 'manifest unavailable' });
      }
      return null;
    }

    const entry = toManifestEntry(manifest, year);
    if (!entry) {
      diagnostics.log('manifest:missing-entry', { year });
      return null;
    }

    return loadCanonicalFromEntry(entry, {
      base: manifestBase,
      fetchFn,
      xhrFactory,
      diagnostics,
      year
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

    try {
      const canonical = await attemptCanonicalLoad(candidates, {
        year,
        fetchFn,
        xhrFactory,
        diagnostics
      });
      if (canonical) {
        return canonical;
      }
    } catch (canonicalError) {
      diagnostics.log('manifest:data-error', { year, message: canonicalError && canonicalError.message });
    }

    let lastError = null;
    for (const candidate of candidates) {
      const resource = buildResourcePath(candidate, year);
      diagnostics.log('load:resource', { resource });
      try {
        if (fetchFn) {
          const result = await loadViaFetch(resource, fetchFn, diagnostics, null, 'fetch', 'load:complete');
          return result;
        }
      } catch (error) {
        diagnostics.log('load:fetch-error', { resource, message: error && error.message });
        lastError = error;
      }

      if (xhrFactory) {
        try {
          const result = await loadViaXhr(resource, xhrFactory, diagnostics, null, 'xhr', 'load:complete');
          return result;
        } catch (error) {
          diagnostics.log('load:xhr-error', { resource, message: error && error.message });
          lastError = error;
        }
      }
    }

    const embedded = resolveEmbeddedCatalog(options);
    if (embedded) {
      const fallback = extractEmbeddedEntry(embedded.catalog, year);
      if (fallback) {
        try {
          if (fallback && typeof fallback === 'object') {
            if (Array.isArray(fallback.categories)) {
              const normalized = normalizeAwardsData(fallback);
              diagnostics.log('load:embedded-success', { year, source: embedded.source, mode: 'direct' });
              return normalized;
            }

            if (fallback.data && typeof fallback.data === 'object') {
              const normalized = normalizeAwardsData(fallback.data);
              diagnostics.log('load:embedded-success', { year, source: embedded.source, mode: 'snapshot' });
              return normalized;
            }

            if (fallback.path || fallback.source) {
              const canonicalFallback = await loadCanonicalFromEntry(fallback, {
                base: fallback.base || fallback.root || 'years',
                fetchFn,
                xhrFactory,
                diagnostics,
                year
              });
              diagnostics.log('load:embedded-success', { year, source: embedded.source, mode: 'canonical' });
              return canonicalFallback;
            }
          }

          throw new Error('Unsupported embedded entry format.');
        } catch (error) {
          diagnostics.log('load:embedded-error', { year, message: error && error.message });
          lastError = error;
        }
      } else {
        diagnostics.log('load:embedded-miss', { year, source: embedded.source });
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
