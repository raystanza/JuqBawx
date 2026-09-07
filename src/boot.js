// Startup wiring. Loads last, after core and every visualizer module.
(() => {
  'use strict';

  const { internal, registry } = JuqBawx;

  if (!registry.length) {
    throw new Error('No visualizers were registered; check the script tags in index.html');
  }

  internal.frame.attachPointerEvents();
  window.addEventListener('resize', internal.canvas.resize, { passive: true });

  internal.profiles.load();
  internal.properties.applyPreset();
  internal.canvas.resize();
  internal.properties.setTheme(0);
  internal.nowplaying.updateNowPlaying();
  internal.properties.updateBadge();
  internal.properties.updateUiPosition();
  internal.profiles.queuePropertyInitialization();
  internal.frame.start();
})();
