'use strict';

const { createHarness } = require('../tools/headless.cjs');

function createTestHarness(t, options = {}) {
  // Drive startup, debounced saves, and frame timestamps without wall-clock waits.
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
  return createHarness({ ...options, performance: { now: () => Date.now() } });
}

module.exports = { createTestHarness };
