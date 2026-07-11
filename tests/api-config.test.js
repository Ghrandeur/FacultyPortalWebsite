const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

test('api-config exposes globals when loaded as a classic browser script', () => {
  const scriptPath = path.join(__dirname, '..', 'assets', 'js', 'api-config.js');
  const source = fs.readFileSync(scriptPath, 'utf8');

  const context = {
    window: {
      location: { origin: 'https://example.com', hostname: 'example.com' },
      __BACKEND_URL__: '',
      API_URL: '',
    },
    console,
    setTimeout,
    clearTimeout,
  };
  context.window.window = context.window;

  const vmContext = vm.createContext(context);

  assert.doesNotThrow(() => vm.runInContext(source, vmContext));
  assert.equal(context.window.API_URL, 'https://example.com/api');
  assert.equal(context.window.BACKEND_BASE_URL, 'https://example.com');
  assert.equal(typeof context.window.normalizeMediaUrl, 'function');
});
