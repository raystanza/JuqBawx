// The JuqBawx global and the visualizer registry. Loads before everything else.
(() => {
  'use strict';

  const registry = [];
  const byId = new Map();

  // Shared frame context. Core modules hang their exports off this and
  // visualizers destructure what they need. Same object for the life of the
  // wallpaper, so holding a reference to it is safe.
  const fx = {
    clamp: (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    TAU: Math.PI * 2
  };

  const DEFAULT_TUNING = { sensitivity: 1, glow: 1, trail: 1, beat: 1 };

  function register(visualizer) {
    if (!visualizer || typeof visualizer !== 'object') {
      throw new Error('JuqBawx.register expects a visualizer object');
    }
    const { id, name, draw } = visualizer;
    if (typeof id !== 'string' || !id.trim()) {
      throw new Error('A visualizer needs a non-empty string id');
    }
    if (byId.has(id)) {
      throw new Error(`Duplicate visualizer id "${id}"`);
    }
    if (typeof draw !== 'function') {
      throw new Error(`Visualizer "${id}" needs a draw(fx, t) function`);
    }

    // Spread first so a visualizer can pass through flags this function knows
    // nothing about (fullscreenUi, and whatever a later scene needs). The
    // normalized fields below win.
    const entry = {
      ...visualizer,
      id,
      name: name || id,
      label: visualizer.label || name || id,
      categories: Array.isArray(visualizer.categories) ? visualizer.categories.slice() : [],
      tuning: { ...DEFAULT_TUNING, ...(visualizer.tuning || {}) },
      draw,
      resize: typeof visualizer.resize === 'function' ? visualizer.resize : null,
      invalidate: typeof visualizer.invalidate === 'function' ? visualizer.invalidate : null,
      index: registry.length
    };

    registry.push(entry);
    byId.set(id, entry);
    return entry;
  }

  const JuqBawx = {
    fx,
    registry,
    register,
    get: index => registry[index] || null,
    find: id => byId.get(id) || null,
    indexOf: id => (byId.has(id) ? byId.get(id).index : -1),
    get count() { return registry.length; },
    // Core-to-core wiring. Visualizers never see this.
    internal: {}
  };

  window.JuqBawx = JuqBawx;
})();
