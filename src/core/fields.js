// Particle fields shared by more than one visualizer. Anything used by a single
// visualizer belongs in that visualizer's own file instead.
(() => {
  'use strict';

  const { fx, internal } = JuqBawx;
  const { TAU } = fx;

  // stars: Galactic Equalizer and Starlight Rings
  // particleSeed: Particle Constellation and Bioluminescent Tide
  fx.stars = [];
  fx.particleSeed = [];

  function buildParticles() {
    const { width, height } = fx;
    const count = Math.max(64, Math.floor((width * height) / 24000));
    fx.particleSeed = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 0.8 + Math.random() * 2.6,
      phase: Math.random() * TAU,
      band: i % 110,
      orbit: 18 + Math.random() * 90
    }));
  }

  function buildStars() {
    const { width, height } = fx;
    const count = Math.max(140, Math.floor((width * height) / 11000));
    fx.stars = Array.from({ length: count }, () => ({
      angle: Math.random() * TAU,
      radius: Math.random() * Math.max(width, height) * 0.72,
      z: Math.random(),
      speed: 0.18 + Math.random() * 0.8
    }));
  }

  internal.fields = {
    rebuild() {
      buildParticles();
      buildStars();
    }
  };
})();
