const test = require('node:test');
const assert = require('node:assert/strict');

const words = require('../Awards Webpage/js/backgroundWords.js');

function payload(categories) {
  return { year: 'test', title: '', categories };
}

test('collectWordsFromAwards returns distinct plain-text phrases for eligible years', () => {
  const awardsByYear = new Map([
    ['2023', payload([
      {
        category: 'Best Book',
        nominations: ['<i>Alpha Story</i>', '<b>Beta Tale</b>'],
        winner: '<span>Alpha Story</span>',
        runnerUp: 'Gamma Chronicle'
      }
    ])],
    ['2024', payload([
      {
        category: 'Most Anticipated',
        nominations: ['Delta Adventure', 'Epsilon Mystery'],
        winner: 'Zeta Legend',
        runnerUp: ''
      }
    ])],
    ['2025', payload([
      {
        category: 'Future Category',
        nominations: ['Future Book'],
        winner: 'Omega',
        runnerUp: ''
      }
    ])]
  ]);

  const result = words.collectWordsFromAwards({ awardsByYear, maxYear: '2024' });

  const sorted = [...result].sort();
  assert.deepEqual(sorted, [
    'Alpha Story',
    'Best Book',
    'Beta Tale',
    'Delta Adventure',
    'Epsilon Mystery',
    'Gamma Chronicle',
    'Most Anticipated',
    'Zeta Legend'
  ]);
});

test('collectWordsFromAwards ignores invalid inputs and handles whitespace gracefully', () => {
  const awardsByYear = new Map([
    ['2024', payload([
      {
        category: '  Stellar Find  ',
        nominations: ['  <em>Nova</em>  ', null, undefined],
        winner: '  Supernova  ',
        runnerUp: ''
      }
    ])],
    ['not-a-year', payload([])],
    ['2026', null]
  ]);

  const result = words.collectWordsFromAwards({ awardsByYear, maxYear: '2024' });
  assert.deepEqual(result.sort(), ['Nova', 'Stellar Find', 'Supernova']);
});
