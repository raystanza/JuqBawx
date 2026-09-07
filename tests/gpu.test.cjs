'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createTestHarness } = require('./helpers.cjs');

test('GPU programs compile once and are reused across frames', t => {
  const { JuqBawx, counters } = createTestHarness(t, { mockWebGl: true });
  const scene = JuqBawx.find('skyline-pulse');
  scene.draw(JuqBawx.fx, 0);
  scene.draw(JuqBawx.fx, 20);
  assert.equal(counters.gpuProgramsCreated, 1);
  assert.equal(counters.gpuDrawCalls, 2);
});

for (const failure of ['compile', 'link']) {
  test(`a shader ${failure} failure uses Canvas without disabling other GPU scenes`, t => {
    const { JuqBawx, webGlContext: gl, counters, canvasCalls } = createTestHarness(t, { mockWebGl: true });
    const warning = t.mock.method(console, 'warn', () => {});
    t.mock.method(gl, 'createShader', type => ({ type }));
    const status = failure === 'compile'
      ? t.mock.method(gl, 'getShaderParameter', shader => shader.type !== gl.FRAGMENT_SHADER)
      : t.mock.method(gl, 'getProgramParameter', () => false);
    const scene = JuqBawx.find('skyline-pulse');
    scene.draw(JuqBawx.fx, 0);
    assert.equal(counters.gpuDrawCalls, 0);
    assert.ok(canvasCalls.fillRect > 0, 'the scene should draw its Canvas fallback');
    assert.equal(warning.mock.callCount(), 1);

    status.mock.restore();
    const fills = canvasCalls.fillRect;
    scene.draw(JuqBawx.fx, 20);
    assert.equal(counters.gpuDrawCalls, 0, 'failed programs should not retry every frame');
    assert.ok(canvasCalls.fillRect > fills);
    assert.equal(warning.mock.callCount(), 1);

    JuqBawx.find('galactic-equalizer').draw(JuqBawx.fx, 40);
    assert.equal(counters.gpuDrawCalls, 1, 'a different program should still use the GPU');
  });
}

test('context loss falls back to Canvas and restoration rebuilds the GPU program', t => {
  const { JuqBawx, webGlContext: gl, counters, canvasCalls } = createTestHarness(t, { mockWebGl: true });
  const { fx } = JuqBawx;
  const scene = JuqBawx.find('skyline-pulse');
  scene.draw(fx, 0);
  const lost = t.mock.method(gl, 'isContextLost', () => true);
  scene.draw(fx, 20);
  assert.equal(counters.gpuDrawCalls, 1);
  assert.ok(canvasCalls.fillRect > 0);

  const preventDefault = t.mock.fn();
  fx.gpuCanvas.dispatchEvent({ type: 'webglcontextlost', preventDefault });
  assert.equal(preventDefault.mock.callCount(), 1);
  lost.mock.restore();
  scene.draw(fx, 40);
  assert.equal(counters.gpuDrawCalls, 1, 'wait for the restoration event before rebuilding');
  fx.gpuCanvas.dispatchEvent({ type: 'webglcontextrestored' });
  scene.draw(fx, 60);
  assert.equal(counters.gpuProgramsCreated, 2);
  assert.equal(counters.gpuDrawCalls, 2);
});
