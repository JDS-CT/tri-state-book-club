(function (global, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    global.VotingFormat = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const EXCHANGE_SCHEMA = 'tri-state-book-club/ranked-choice-ballots';
  const EXCHANGE_VERSION = 1;

  function toIsoString(value) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    return new Date().toISOString();
  }

  function createEmptyBallot(options) {
    const { categories = [], voterFields = [] } = options || {};
    const voter = {};
    voterFields.forEach(field => {
      voter[field] = '';
    });

    const rankings = categories.map(category => ({
      category,
      ranking: []
    }));

    return {
      ballotId: '',
      voter,
      rankings,
      notes: ''
    };
  }

  function ensureArray(value, message) {
    if (!Array.isArray(value)) {
      throw new TypeError(message);
    }
    return value.slice();
  }

  function normalizeRankingEntry(entry, index) {
    if (!entry || typeof entry !== 'object') {
      throw new TypeError(`Ranking at index ${index} must be an object.`);
    }

    const category = entry.category || '';
    if (!category) {
      throw new TypeError(`Ranking at index ${index} is missing a category name.`);
    }

    const ranking = ensureArray(entry.ranking || entry.preferences || [], `Ranking list for "${category}" must be an array.`)
      .map(item => {
        if (!item || typeof item !== 'object') {
          throw new TypeError(`Each ranking choice for "${category}" must be an object.`);
        }

        const rank = Number(item.rank);
        const title = item.title || item.choice || '';
        if (!title) {
          throw new TypeError(`Ranking choice for "${category}" is missing a title/choice label.`);
        }
        if (!Number.isFinite(rank) || rank < 1) {
          throw new TypeError(`Ranking choice for "${category}" must include a positive rank.`);
        }

        return { rank, title };
      })
      .sort((a, b) => a.rank - b.rank);

    return { category, ranking };
  }

  function normalizeBallot(ballot, index) {
    if (!ballot || typeof ballot !== 'object') {
      throw new TypeError(`Ballot at index ${index} must be an object.`);
    }

    const rankings = ensureArray(ballot.rankings, `Ballot at index ${index} must include a rankings array.`)
      .map(normalizeRankingEntry);

    const voter = ballot.voter && typeof ballot.voter === 'object' ? { ...ballot.voter } : {};
    const normalized = {
      ballotId: typeof ballot.ballotId === 'string' ? ballot.ballotId : '',
      voter,
      rankings,
      notes: typeof ballot.notes === 'string' ? ballot.notes : ''
    };

    if (ballot.submittedAt) {
      normalized.submittedAt = toIsoString(ballot.submittedAt);
    }

    return normalized;
  }

  function buildExchangeEnvelope(options) {
    const { year, ballots = [], source = {}, generatedAt } = options || {};
    if (!year) {
      throw new TypeError('A ceremony year is required to build the exchange envelope.');
    }

    const normalizedBallots = ensureArray(ballots, 'Ballots must be provided as an array.').map(normalizeBallot);

    return {
      schema: EXCHANGE_SCHEMA,
      version: EXCHANGE_VERSION,
      year,
      generatedAt: toIsoString(generatedAt),
      source: source && typeof source === 'object' ? { ...source } : {},
      ballots: normalizedBallots
    };
  }

  function parseExchange(payload) {
    let data = payload;
    if (typeof payload === 'string') {
      data = JSON.parse(payload);
    }

    if (!data || typeof data !== 'object') {
      throw new TypeError('Exchange payload must be an object.');
    }

    if (data.schema !== EXCHANGE_SCHEMA) {
      throw new Error(`Unexpected schema identifier: ${data.schema}`);
    }

    if (data.version !== EXCHANGE_VERSION) {
      throw new Error(`Unsupported exchange version: ${data.version}`);
    }

    const normalizedBallots = ensureArray(data.ballots, 'Exchange payload must include a ballots array.').map(normalizeBallot);

    return {
      schema: EXCHANGE_SCHEMA,
      version: EXCHANGE_VERSION,
      year: typeof data.year === 'string' ? data.year : '',
      generatedAt: data.generatedAt ? toIsoString(data.generatedAt) : '',
      source: data.source && typeof data.source === 'object' ? { ...data.source } : {},
      ballots: normalizedBallots
    };
  }

  return {
    EXCHANGE_SCHEMA,
    EXCHANGE_VERSION,
    createEmptyBallot,
    buildExchangeEnvelope,
    parseExchange
  };
});
