const test = require('node:test');
const assert = require('node:assert/strict');

const VotingFormat = require('../Awards Webpage/js/votingFormat.js');

const SAMPLE_CATEGORIES = ['Best Book', 'Best Character'];
const SAMPLE_FIELDS = ['name', 'email'];

function assertIsoTimestamp(value) {
  assert.equal(typeof value, 'string', 'timestamp should be a string');
  assert.match(value, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/, 'timestamp should match ISO 8601 with milliseconds');
}

test('createEmptyBallot builds voter fields and per-category ranking buckets', () => {
  const ballot = VotingFormat.createEmptyBallot({
    categories: SAMPLE_CATEGORIES,
    voterFields: SAMPLE_FIELDS,
  });

  assert.deepEqual(Object.keys(ballot.voter), SAMPLE_FIELDS, 'voter object should include all requested fields');
  assert.equal(ballot.ballotId, '', 'ballotId defaults to empty string');
  assert.equal(ballot.notes, '', 'notes defaults to empty string');
  assert.equal(Array.isArray(ballot.rankings), true, 'rankings should be an array');
  assert.deepEqual(ballot.rankings, [
    { category: 'Best Book', ranking: [] },
    { category: 'Best Character', ranking: [] },
  ]);
});

test('buildExchangeEnvelope wraps ballots with schema metadata and timestamp', () => {
  const empty = VotingFormat.createEmptyBallot({ categories: SAMPLE_CATEGORIES, voterFields: SAMPLE_FIELDS });
  const envelope = VotingFormat.buildExchangeEnvelope({
    year: '2025',
    ballots: [empty],
    source: { type: 'prototype-form', location: 'Awards Webpage' },
  });

  assert.equal(envelope.schema, VotingFormat.EXCHANGE_SCHEMA);
  assert.equal(envelope.version, VotingFormat.EXCHANGE_VERSION);
  assert.equal(envelope.year, '2025');
  assert.deepEqual(envelope.source, { type: 'prototype-form', location: 'Awards Webpage' });
  assertIsoTimestamp(envelope.generatedAt);
  assert.deepEqual(envelope.ballots, [empty]);
});

test('parseExchange validates schema and normalizes ballots array', () => {
  const raw = VotingFormat.buildExchangeEnvelope({
    year: '2024',
    ballots: [
      {
        ballotId: 'abc123',
        voter: { name: 'Dana' },
        rankings: [
          { category: 'Best Book', ranking: [
            { rank: 1, title: '<i>Sample</i>' },
            { rank: 2, title: '<i>Another</i>' },
          ] },
        ],
        notes: 'Excited for the finals!',
      },
    ],
    source: { type: 'google-form', id: 'form-1' },
    generatedAt: '2024-12-31T23:59:59.000Z',
  });

  const parsed = VotingFormat.parseExchange(raw);
  assert.equal(parsed.year, '2024');
  assert.deepEqual(parsed.source, { type: 'google-form', id: 'form-1' });
  assert.deepEqual(parsed.ballots[0].rankings[0].ranking[0], { rank: 1, title: '<i>Sample</i>' });
});

test('parseExchange rejects payloads with a mismatched schema identifier', () => {
  assert.throws(() => {
    VotingFormat.parseExchange({ schema: 'other', version: 1, year: '2024', ballots: [] });
  }, /schema/i);
});
