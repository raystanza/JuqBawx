'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createTestHarness } = require('./helpers.cjs');

test('audio input clamps outliers and rejects non-finite samples', t => {
  const { window, JuqBawx: { fx, internal } } = createTestHarness(t);
  window.livelyAudioListener([1, -2, 4, NaN, Infinity, '0.5', 'invalid']);
  internal.audio.updateAudio(Date.now());

  assert.ok(fx.audio.every(Number.isFinite));
  assert.ok(fx.audio[0] > 0);
  assert.equal(fx.audio[1], 0);
  assert.ok(Math.abs(fx.audio[2] / fx.audio[0] - 1.5) < 1e-6);
  assert.equal(fx.audio[3], 0);
  assert.equal(fx.audio[4], 0);
  assert.equal(fx.audio[5], fx.audio[0] / 2);
  assert.ok(fx.audio.slice(6).every(value => value === 0));
});

test('short and empty audio updates clear old bins; missing payloads are ignored', t => {
  const { window, JuqBawx: { fx, internal } } = createTestHarness(t);
  window.livelyAudioListener(new Float32Array(128).fill(1));
  for (const payload of [null, undefined, {}]) window.livelyAudioListener(payload);
  internal.audio.updateAudio(Date.now());
  const initial = fx.audio[127];
  assert.ok(initial > 0);

  window.livelyAudioListener([1]);
  internal.audio.updateAudio(Date.now());
  assert.ok(fx.audio[0] > initial);
  assert.ok(fx.audio[127] < initial, 'bins missing from the new payload must decay');

  const first = fx.audio[0];
  window.livelyAudioListener([]);
  internal.audio.updateAudio(Date.now());
  assert.ok(fx.audio[0] < first);
});

test('resampling preserves a flat spectrum, bounds output, and refreshes cached values', t => {
  const { window, JuqBawx: { fx, internal } } = createTestHarness(t);
  Object.assign(internal.state.runtime, { sensitivity: 1, bassBoost: 1 });
  window.livelyAudioListener(Array(128).fill(1));
  internal.audio.updateAudio(Date.now());
  const level = fx.audio[0];

  for (const count of [1, 8, 64, 128]) {
    const bands = fx.resample(count);
    assert.equal(bands.length, count);
    // Prefix sums are Float32; subtracting adjacent sums loses a few ulps.
    assert.ok(bands.every(value => Math.abs(value - level) < 1e-5));
  }
  for (const band of [fx.bass(), fx.mids(), fx.highs(), fx.energy()]) {
    assert.ok(Math.abs(band - level) < 1e-6);
  }
  assert.equal(fx.resample(0).length, 1);
  assert.equal(fx.resample(200).length, 128);

  internal.state.runtime.bassBoost = 2;
  const boosted = fx.resample(8);
  assert.ok(boosted[0] > boosted[7], 'bass boost should favor low frequencies');
  internal.state.runtime.sensitivity = 3;
  assert.equal(fx.resample(8)[0], 1.5);

  Object.assign(internal.state.runtime, { sensitivity: 1, bassBoost: 1 });
  window.livelyAudioListener([]);
  internal.audio.updateAudio(Date.now());
  assert.ok(fx.resample(8).every(value => value < level), 'cached bands must reflect the latest frame');
});

test('stale audio fades to silence when idle motion is disabled', t => {
  const { window, JuqBawx: { fx, internal } } = createTestHarness(t);
  internal.state.runtime.idleMotion = false;
  window.livelyAudioListener(Array(128).fill(1));
  internal.audio.updateAudio(Date.now());
  assert.ok(fx.energy() > 0.2);
  assert.ok(fx.beat > 0);

  for (let frame = 0; frame < 240; frame++) internal.audio.updateAudio(Date.now() + 1000 + frame * 17);
  assert.ok(fx.audio.every(value => value < 0.001));
  assert.equal(fx.beat, 0);
});
