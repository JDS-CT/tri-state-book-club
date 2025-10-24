const test = require('node:test');
const assert = require('node:assert/strict');

const consoleModule = require('../Awards Webpage/js/diagnosticsConsole.js');
const loader = require('../Awards Webpage/js/awardsLoader.js');

function createButton(action) {
  const listeners = [];
  return {
    dataset: { diagnosticsAction: action },
    addEventListener(event, handler) {
      if (event === 'click') {
        listeners.push(handler);
      }
    },
    trigger() {
      listeners.forEach(listener => listener());
    }
  };
}

test('formatEntry creates readable lines with serialized details', () => {
  const line = consoleModule.formatEntry({
    timestamp: '2024-05-01T00:00:00.000Z',
    type: 'load:start',
    details: { year: '2024', basePath: 'years' }
  });
  assert.equal(line.includes('load:start'), true);
  assert.equal(line.includes('year="2024"'), true);
});

test('buildCopyBuffer handles empty and populated diagnostics', () => {
  assert.equal(consoleModule.buildCopyBuffer([]), 'No diagnostics recorded yet.');

  const buffer = consoleModule.buildCopyBuffer([
    { timestamp: 'now', type: 'event', details: { ok: true } }
  ]);
  assert.equal(buffer.includes('event'), true);
  assert.equal(buffer.includes('ok=true'), true);
});

test('DiagnosticsConsole integrates with channel and actions', async () => {
  const output = { textContent: '' };
  const status = { textContent: '' };
  const copyNotice = { textContent: '' };
  const buttons = [createButton('clear-log'), createButton('copy-log'), createButton('custom-action')];
  let clipboardText = '';

  const container = {
    querySelector(selector) {
      if (selector === '[data-role="diagnostics-output"]') {
        return output;
      }
      if (selector === '[data-role="diagnostics-status"]') {
        return status;
      }
      if (selector === '[data-role="diagnostics-copy"]') {
        return copyNotice;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-diagnostics-action]') {
        return buttons;
      }
      return [];
    }
  };

  const channel = loader.createDiagnosticsChannel();

  const consoleInstance = consoleModule.createConsole({
    container,
    channel,
    clipboard(text) {
      clipboardText = text;
      return Promise.resolve();
    },
    actions: {
      'custom-action': () => {
        channel.log('ui:custom', { invoked: true });
        return 'Custom action completed.';
      }
    }
  });

  assert.equal(output.textContent, 'No diagnostics recorded yet.');

  channel.log('load:start', { year: '2024' });
  assert.equal(output.textContent.includes('load:start'), true);

  await consoleInstance.handleAction('copy-log');
  assert.equal(clipboardText.includes('load:start'), true);
  assert.equal(status.textContent.includes('copied') || status.textContent.includes('Copied'), true);

  await consoleInstance.handleAction('custom-action');
  assert.equal(status.textContent.includes('Custom action completed'), true);
  assert.equal(output.textContent.includes('ui:custom'), true);

  await consoleInstance.handleAction('clear-log');
  assert.equal(output.textContent.includes('No diagnostics recorded yet.'), true);
});
