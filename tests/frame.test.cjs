'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createTestHarness } = require('./helpers.cjs');

test('frame pacing honors 30 FPS and playback pause/resume without a large animation jump', t => {
  const { window, frames, JuqBawx } = createTestHarness(t);
  const draw = t.mock.method(JuqBawx.registry[0], 'draw', () => {});
  window.livelyPropertyListener('fps', 1);
  frames.shift()(1000);
  frames.shift()(1010);
  assert.equal(draw.mock.callCount(), 1);
  frames.shift()(1034);
  assert.equal(draw.mock.callCount(), 2);

  for (const [pause, resume] of [[false, true], ['false', 'true'], [{ IsPaused: true }, { IsPaused: false }], ['{"IsPaused":true}', '{"IsPaused":false}']]) {
    const before = draw.mock.callCount();
    const previousTime = draw.mock.calls.at(-1).arguments[1];
    window.livelyWallpaperPlaybackChanged(pause);
    window.livelyWallpaperPlaybackChanged('{invalid');
    frames.shift()(10000 + before * 1000);
    assert.equal(draw.mock.callCount(), before);
    assert.equal(frames.length, 1, 'paused frames must keep scheduling so playback can resume');
    window.livelyWallpaperPlaybackChanged(resume);
    frames.shift()(10040 + before * 1000);
    assert.equal(draw.mock.callCount(), before + 1);
    assert.ok(draw.mock.calls.at(-1).arguments[1] - previousTime <= 100);
  }
});

test('auto-cycle waits for its interval, wraps within a category, and honors pack overrides', t => {
  const { window, frames, JuqBawx: { internal, registry } } = createTestHarness(t);
  const { settings } = internal.state;
  const advance = milliseconds => {
    t.mock.timers.tick(milliseconds);
    frames.shift()(Date.now());
  };
  window.livelyPropertyListener('perThemeSettings', false);
  window.livelyPropertyListener('category', 6); // Shader Lab
  const shaders = registry.filter(entry => entry.categories.includes('shader'));
  window.livelyPropertyListener('visualizer', shaders.at(-1).index);
  window.livelyPropertyListener('cycleSeconds', 5);
  window.livelyPropertyListener('autoCycle', true);
  advance(4980);
  assert.equal(settings.visualizer, shaders.at(-1).index);
  advance(20);
  assert.equal(settings.visualizer, shaders[0].index);
  advance(5000);
  assert.equal(settings.visualizer, shaders[1].index);

  window.livelyPropertyListener('presetPack', 5); // Winamp Classics overrides Shader Lab
  const winamp = registry.filter(entry => entry.categories.includes('winamp'));
  window.livelyPropertyListener('visualizer', winamp.at(-1).index);
  advance(5000);
  assert.equal(settings.visualizer, winamp[0].index);
  window.livelyPropertyListener('autoCycle', false);
  advance(5000);
  assert.equal(settings.visualizer, winamp[0].index);
});
