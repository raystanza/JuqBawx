// Settings, presets, and the category taxonomy.
(() => {
  'use strict';

  const { fx, internal, registry } = JuqBawx;

  // Dropdown order for the "Visualizer category" property. Index 0 means every
  // visualizer; the rest match a category tag the modules declare themselves.
  const CATEGORIES = [
    { id: 'all', label: 'All Visualizers' },
    { id: 'modern', label: 'Modern / Neon' },
    { id: 'winamp', label: 'Winamp Classics' },
    { id: 'milkdrop', label: 'MilkDrop Psychedelic' },
    { id: 'retro', label: 'Retro Hardware' },
    { id: 'ambient', label: 'Ambient / Chill' },
    { id: 'shader', label: 'Shader Lab' },
    { id: 'procedural', label: 'Procedural Worlds' },
    { id: 'album', label: 'Album Atmospheres' },
    { id: 'interactive', label: 'Interactive' }
  ];

  const PRESETS = [
    {},
    { colorMode: 2, background: 7, glow: 0.42, trail: 0.34, beatPulse: 1.05, crtOverlay: true, scanlineStrength: 0.72, vignette: true },
    { colorMode: 4, background: 1, glow: 0.56, trail: 0.48, beatPulse: 0.72, crtOverlay: false, scanlineStrength: 0.18, vignette: true },
    { colorMode: 3, background: 4, glow: 0.92, trail: 0.18, beatPulse: 1.55, crtOverlay: false, scanlineStrength: 0.2, vignette: true },
    { colorMode: 1, background: 3, glow: 1.0, trail: 0.6, beatPulse: 1.45, crtOverlay: true, scanlineStrength: 0.35, vignette: true },
    { colorMode: 2, background: 7, glow: 0.5, trail: 0.28, beatPulse: 1.08, crtOverlay: true, scanlineStrength: 0.82, vignette: true },
    { colorMode: 1, background: 4, glow: 1.0, trail: 0.68, beatPulse: 1.5, crtOverlay: false, scanlineStrength: 0.18, vignette: true },
    { colorMode: 1, background: 4, glow: 0.88, trail: 0.14, beatPulse: 1.15, visualContrast: 1.12, vignette: true },
    { colorMode: 0, background: 1, glow: 0.68, trail: 0.24, beatPulse: 0.9, visualContrast: 1.08, vignette: true },
    { colorMode: 5, background: 4, glow: 0.62, trail: 0.28, beatPulse: 0.72, albumArtReactive: true, albumArtStrength: 0.82, vignette: true },
    { colorMode: 5, background: 1, glow: 0.38, trail: 0.48, beatPulse: 0.3, motionSpeed: 0.55, ambientMotion: 0.32, albumArtReactive: true, albumArtStrength: 0.7, beatFlash: false, vignette: true },
    { colorMode: 0, background: 0, glow: 0.82, trail: 0.42, beatPulse: 1.08, interactionEnabled: true, interactionStrength: 1.15, vignette: true }
  ];

  // Preset pack index -> category index it locks auto-cycle to.
  const PACK_CATEGORIES = { 5: 2, 6: 3, 7: 6, 8: 7, 9: 8, 10: 5, 11: 9 };

  const DEFAULT_SETTINGS = Object.freeze({
    visualizer: 0,
    category: 0,
    presetPack: 0,
    perThemeSettings: true,
    sensitivity: 1.35,
    bassBoost: 1.2,
    beatPulse: 1.0,
    smoothing: 0.72,
    motionSpeed: 1,
    colorSaturation: 1,
    visualContrast: 1,
    glow: 0.72,
    trail: 0.26,
    scanlineStrength: 0.46,
    barCount: 64,
    colorMode: 0,
    accent: '#18e0ff',
    secondary: '#b031ff',
    background: 0,
    kaleidoSymmetry: 3,
    kaleidoComplexity: 0.68,
    kaleidoZoom: 1,
    kaleidoRotation: 0.45,
    albumArtReactive: true,
    albumArtStrength: 0.42,
    beatFlash: false,
    beatFlashStrength: 0.28,
    interactionEnabled: true,
    interactionMode: 0,
    interactionStrength: 0.8,
    ambientMotion: 0.55,
    shaderQuality: 1,
    crtOverlay: false,
    vignette: true,
    showTrack: true,
    showThemeName: false,
    idleMotion: true,
    autoCycle: false,
    cycleSeconds: 20,
    uiPosition: 0,
    fps: 60
  });

  const settings = { ...DEFAULT_SETTINGS };

  // settings + active preset + the current visualizer's tuning, rewritten in
  // place so every module can keep a reference to it.
  const runtime = { ...DEFAULT_SETTINGS };

  const uiPositions = ['bl', 'br', 'tl', 'tr'];

  // Registry indices of the visualizers in a category.
  function categoryThemes(index) {
    if (index <= 0) return registry.map(entry => entry.index);
    const category = CATEGORIES[index];
    if (!category) return registry.map(entry => entry.index);
    const list = registry.filter(entry => entry.categories.includes(category.id)).map(entry => entry.index);
    return list.length ? list : registry.map(entry => entry.index);
  }

  function activeCategoryIndex() {
    if (PACK_CATEGORIES[settings.presetPack] !== undefined) return PACK_CATEGORIES[settings.presetPack];
    return fx.clamp(settings.category, 0, CATEGORIES.length - 1);
  }

  internal.state = {
    CATEGORIES, PRESETS, PACK_CATEGORIES, DEFAULT_SETTINGS,
    settings, runtime, uiPositions, categoryThemes, activeCategoryIndex
  };

  fx.settings = settings;
  fx.runtime = runtime;
})();
