'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../tools/headless.cjs');
const { createTestHarness } = require('./helpers.cjs');

const STORAGE_KEY = 'jukebox-theme-profiles-v3';

test('saved profiles restore after property initialization and sanitize stored values', t => {
  const storage = new Map([[STORAGE_KEY, JSON.stringify({ version: 3, profiles: {
    'neon-spectrum': {
      glow: 99, barCount: 23.6, sensitivity: 'invalid', accent: '#A1b2C3', secondary: 'red',
      beatFlash: 'false', visualizer: 12, presetPack: 3
    },
    'removed-scene': { glow: 0.1 },
    0: { glow: 0.2 }
  } })]]);
  const { window, JuqBawx: { internal } } = createTestHarness(t, { storage });
  const { settings, DEFAULT_SETTINGS } = internal.state;

  window.livelyPropertyListener('glow', 45);
  t.mock.timers.tick(159);
  assert.equal(internal.profiles.isReady(), false);
  assert.equal(settings.glow, 0.45);
  window.livelyPropertyListener('sensitivity', 150);
  t.mock.timers.tick(159);
  assert.equal(internal.profiles.isReady(), false, 'each initial property extends the settling period');
  t.mock.timers.tick(1);

  assert.equal(internal.profiles.isReady(), true);
  assert.equal(settings.glow, 1);
  assert.equal(settings.barCount, 24);
  assert.equal(settings.sensitivity, 1.5);
  assert.equal(settings.accent, '#A1b2C3');
  assert.equal(settings.secondary, DEFAULT_SETTINGS.secondary);
  assert.equal(settings.beatFlash, false);
  assert.equal(settings.visualizer, 0);
  assert.equal(settings.presetPack, 0);

  window.livelyPropertyListener('glow', 80);
  t.mock.timers.tick(140);
  const saved = JSON.parse(storage.get(STORAGE_KEY));
  assert.deepEqual(Object.keys(saved.profiles), ['neon-spectrum']);
  assert.equal(saved.profiles['neon-spectrum'].glow, 0.8);
  assert.equal('visualizer' in saved.profiles['neon-spectrum'], false);
});

test('corrupt storage and legacy numeric profiles fall back to the initialized settings', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
  for (const payload of ['{broken', 'null', JSON.stringify({ version: 2, profiles: { 0: { glow: 0.99 } } })]) {
    const storage = new Map([[STORAGE_KEY, payload]]);
    const { window, JuqBawx: { internal, registry } } = createHarness({ storage });
    window.livelyPropertyListener('glow', 37);
    t.mock.timers.tick(160);
    assert.equal(internal.profiles.isReady(), true);
    assert.equal(internal.state.settings.glow, 0.37);
    const saved = JSON.parse(storage.get(STORAGE_KEY));
    assert.equal(saved.version, 3);
    assert.deepEqual(Object.keys(saved.profiles), [registry[0].id]);
    assert.equal(saved.profiles[registry[0].id].glow, 0.37);
  }
});

test('switching during a queued save preserves each theme and survives a fresh load', t => {
  const storage = new Map();
  const { window, JuqBawx: { internal, registry } } = createTestHarness(t, { storage });
  t.mock.timers.tick(160);
  window.livelyPropertyListener('glow', 11);
  window.livelyPropertyListener('visualizer', 1);
  window.livelyPropertyListener('glow', 88);
  t.mock.timers.tick(139);
  assert.equal(JSON.parse(storage.get(STORAGE_KEY)).profiles[registry[1].id], undefined);
  t.mock.timers.tick(1);

  const saved = JSON.parse(storage.get(STORAGE_KEY));
  assert.equal(saved.profiles[registry[0].id].glow, 0.11);
  assert.equal(saved.profiles[registry[1].id].glow, 0.88);
  window.livelyPropertyListener('visualizer', 0);
  assert.equal(internal.state.settings.glow, 0.11);

  const reloaded = createHarness({ storage });
  t.mock.timers.tick(160);
  assert.equal(reloaded.JuqBawx.internal.state.settings.glow, 0.11);
  reloaded.window.livelyPropertyListener('visualizer', 1);
  assert.equal(reloaded.JuqBawx.internal.state.settings.glow, 0.88);
  assert.equal(internal.state.settings.visualizer, 0, 'a fresh harness must have independent state');
});

test('unavailable browser storage still permits profiles for the current session', t => {
  const storage = {
    get() { throw new Error('Storage disabled'); },
    set() { throw new Error('Storage disabled'); }
  };
  const { window, JuqBawx: { internal } } = createTestHarness(t, { storage });
  t.mock.timers.tick(160);
  window.livelyPropertyListener('glow', 23);
  window.livelyPropertyListener('visualizer', 1);
  window.livelyPropertyListener('glow', 67);
  t.mock.timers.tick(140);
  window.livelyPropertyListener('visualizer', 0);
  assert.equal(internal.state.settings.glow, 0.23);
  window.livelyPropertyListener('visualizer', 1);
  assert.equal(internal.state.settings.glow, 0.67);
});
