// The render loop: frame pacing, pointer smoothing, auto-cycle, and dispatch
// into the registered visualizer.
(() => {
  'use strict';

  const { fx, internal, registry } = JuqBawx;
  const { clamp, lerp } = fx;
  const state = internal.state;
  const { settings, runtime } = state;

  let lastFrame = 0;
  let lastCycleAt = 0;
  let visualTime = 0;
  let lastVisualTimeAt = 0;
  let paused = false;

  const pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, active: false, down: false, impulse: 0 };

  fx.pointer = pointer;
  fx.frameMotionScale = 1;

  function maybeCycleTheme(now) {
    if (!runtime.autoCycle) return;
    if (!lastCycleAt) lastCycleAt = now;
    if (now - lastCycleAt >= runtime.cycleSeconds * 1000) {
      lastCycleAt = now;
      const list = state.categoryThemes(state.activeCategoryIndex());
      const pos = list.indexOf(settings.visualizer);
      internal.properties.setTheme(list[(pos + 1 + list.length) % list.length]);
    }
  }

  function draw(now) {
    if (paused) { requestAnimationFrame(draw); return; }
    const interval = 1000 / runtime.fps;
    const frameElapsed = lastFrame ? now - lastFrame : interval;
    if (frameElapsed < interval) { requestAnimationFrame(draw); return; }
    lastFrame = now;
    fx.frameMotionScale = clamp(frameElapsed / (1000 / 60), 0.2, 4) * runtime.motionSpeed;
    pointer.x = lerp(pointer.x, pointer.targetX, clamp(0.08 * fx.frameMotionScale, 0.03, 0.32));
    pointer.y = lerp(pointer.y, pointer.targetY, clamp(0.08 * fx.frameMotionScale, 0.03, 0.32));
    pointer.impulse *= Math.pow(0.91, clamp(fx.frameMotionScale, 0.25, 3));
    if (!lastVisualTimeAt) lastVisualTimeAt = now;
    visualTime += Math.min(now - lastVisualTimeAt, 100) * runtime.motionSpeed;
    lastVisualTimeAt = now;
    internal.audio.updateAudio(now);
    maybeCycleTheme(now);

    const ctx = fx.ctx;
    ctx.save();
    ctx.filter = `saturate(${runtime.colorSaturation}) contrast(${runtime.visualContrast})`;
    const entry = registry[settings.visualizer] || registry[0];
    if (entry) entry.draw(fx, visualTime);
    ctx.restore();
    internal.screenfx.drawScreenFx(now);
    requestAnimationFrame(draw);
  }

  function updatePointerPosition(event) {
    if (!fx.width || !fx.height) return;
    pointer.targetX = clamp(event.clientX / fx.width, 0, 1);
    pointer.targetY = clamp(event.clientY / fx.height, 0, 1);
    pointer.active = true;
  }

  internal.frame = {
    start() { requestAnimationFrame(draw); },
    setPaused(value) { paused = !!value; },
    resetCycleClock() { lastCycleAt = performance.now(); },
    attachPointerEvents() {
      window.addEventListener('pointermove', updatePointerPosition, { passive: true });
      window.addEventListener('pointerdown', event => {
        updatePointerPosition(event);
        pointer.down = true;
        pointer.impulse = 1;
      }, { passive: true });
      window.addEventListener('pointerup', () => { pointer.down = false; }, { passive: true });
      window.addEventListener('pointercancel', () => { pointer.down = false; pointer.active = false; }, { passive: true });
      document.addEventListener('mouseleave', () => { pointer.down = false; pointer.active = false; });
    }
  };
})();
