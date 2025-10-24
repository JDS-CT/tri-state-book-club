(function (global, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    global.AwardsDiagnosticsConsole = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function formatEntry(entry) {
    if (!entry || typeof entry !== 'object') {
      return '[invalid entry]';
    }
    const timestamp = entry.timestamp || 'unknown-time';
    const type = entry.type || 'event';
    const details = entry && typeof entry.details === 'object' && entry.details !== null ? entry.details : {};
    const serializedDetails = Object.keys(details)
      .map(key => `${key}=${JSON.stringify(details[key])}`)
      .join(', ');
    if (!serializedDetails) {
      return `[${timestamp}] ${type}`;
    }
    return `[${timestamp}] ${type} — ${serializedDetails}`;
  }

  function buildCopyBuffer(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      return 'No diagnostics recorded yet.';
    }
    return entries.map(formatEntry).join('\n');
  }

  function resolveEntries(channel) {
    if (!channel) {
      return [];
    }
    if (typeof channel.snapshot === 'function') {
      return channel.snapshot();
    }
    if (Array.isArray(channel.entries)) {
      return channel.entries.slice();
    }
    return [];
  }

  function DiagnosticsConsole(options) {
    if (!options || typeof options !== 'object') {
      throw new TypeError('DiagnosticsConsole requires an options object.');
    }
    const { container, channel } = options;
    if (!container || typeof container.querySelector !== 'function') {
      throw new TypeError('DiagnosticsConsole requires a container with querySelector.');
    }
    if (!channel || typeof channel.log !== 'function') {
      throw new TypeError('DiagnosticsConsole requires a diagnostics channel.');
    }

    this.container = container;
    this.channel = channel;
    this.actions = options.actions && typeof options.actions === 'object' ? options.actions : {};
    this.clipboard = typeof options.clipboard === 'function' ? options.clipboard : null;

    this.outputElement =
      options.outputElement || container.querySelector('[data-role="diagnostics-output"]');
    if (!this.outputElement) {
      throw new Error('Diagnostics output element not found.');
    }

    this.statusElement =
      options.statusElement || container.querySelector('[data-role="diagnostics-status"]');
    this.copyNoticeElement =
      options.copyNoticeElement || container.querySelector('[data-role="diagnostics-copy"]');

    this.registerListeners();
    this.render();
  }

  DiagnosticsConsole.prototype.registerListeners = function registerListeners() {
    const buttons = typeof this.container.querySelectorAll === 'function'
      ? this.container.querySelectorAll('[data-diagnostics-action]')
      : [];

    buttons.forEach(button => {
      const action =
        (button.dataset && button.dataset.diagnosticsAction) ||
        (typeof button.getAttribute === 'function' && button.getAttribute('data-diagnostics-action'));
      if (!action) {
        return;
      }
      if (typeof button.addEventListener === 'function') {
        button.addEventListener('click', () => {
          this.handleAction(action);
        });
      }
    });

    const existing = resolveEntries(this.channel);
    if (existing.length) {
      this.outputElement.textContent = buildCopyBuffer(existing);
    }

    this.channel.onEvent = entry => {
      this.appendEntry(entry);
    };
  };

  DiagnosticsConsole.prototype.appendEntry = function appendEntry(entry) {
    const entries = resolveEntries(this.channel);
    entries.push(entry);
    this.outputElement.textContent = buildCopyBuffer(entries);
  };

  DiagnosticsConsole.prototype.render = function render() {
    const entries = resolveEntries(this.channel);
    this.outputElement.textContent = buildCopyBuffer(entries);
  };

  DiagnosticsConsole.prototype.setStatus = function setStatus(message) {
    if (this.statusElement) {
      this.statusElement.textContent = message || '';
    }
  };

  DiagnosticsConsole.prototype.handleAction = function handleAction(action) {
    if (!action) {
      return Promise.resolve();
    }

    if (action === 'clear-log') {
      if (typeof this.channel.clear === 'function') {
        this.channel.clear();
      }
      this.render();
      this.setStatus('Diagnostics log cleared.');
      return Promise.resolve();
    }

    if (action === 'copy-log') {
      const text = buildCopyBuffer(resolveEntries(this.channel));
      if (!this.clipboard) {
        this.setStatus('Copy the diagnostics text manually below.');
        return Promise.resolve(text);
      }
      try {
        return Promise.resolve(this.clipboard(text))
          .then(() => {
            this.setStatus('Diagnostics copied to clipboard.');
            return text;
          })
          .catch(error => {
            this.setStatus(error && error.message ? error.message : 'Clipboard copy failed.');
            return text;
          });
      } catch (error) {
        this.setStatus(error && error.message ? error.message : 'Clipboard copy failed.');
        return Promise.resolve(text);
      }
    }

    const handler = this.actions[action];
    if (typeof handler !== 'function') {
      this.setStatus(`No handler registered for action: ${action}`);
      return Promise.resolve();
    }

    this.setStatus(`Running ${action}…`);
    let result;
    try {
      result = handler();
    } catch (error) {
      this.setStatus(error && error.message ? error.message : `Action ${action} failed.`);
      this.render();
      return Promise.reject(error);
    }

    return Promise.resolve(result)
      .then(value => {
        const message =
          (value && typeof value === 'object' && value.message) ||
          (typeof value === 'string' ? value : null);
        this.setStatus(message || `Completed ${action}.`);
        this.render();
        return value;
      })
      .catch(error => {
        this.setStatus(error && error.message ? error.message : `Action ${action} failed.`);
        this.render();
        throw error;
      });
  };

  DiagnosticsConsole.prototype.getCopyText = function getCopyText() {
    return buildCopyBuffer(resolveEntries(this.channel));
  };

  return {
    formatEntry,
    buildCopyBuffer,
    createConsole(options) {
      return new DiagnosticsConsole(options);
    },
    DiagnosticsConsole
  };
});
