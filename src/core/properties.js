// Lively's one-way property bridge, preset/tuning resolution, and theme switching.
(() => {
  'use strict';

  const { fx, internal, registry } = JuqBawx;
  const { clamp } = fx;
  const state = internal.state;
  const { settings, runtime, PRESETS, PACK_CATEGORIES, CATEGORIES, uiPositions } = state;

  function applyPreset() {
    const preset = PRESETS[settings.presetPack] || {};
    const tune = (registry[settings.visualizer] || {}).tuning || { sensitivity: 1, glow: 1, trail: 1, beat: 1 };
    // Rewritten in place; other modules hold a reference to runtime.
    for (const key of Object.keys(runtime)) delete runtime[key];
    Object.assign(runtime, settings, preset);
    runtime.sensitivity *= tune.sensitivity;
    runtime.glow = clamp(runtime.glow * tune.glow, 0, 1.2);
    runtime.trail = clamp(runtime.trail * tune.trail, 0, 0.94);
    runtime.beatPulse *= tune.beat;
    internal.color.markPaletteDirty();
    internal.color.refreshPaletteCache();
    internal.color.updateDossierPalette();
    internal.canvas.refreshRenderScale();
  }

  function updateBadge() {
    const entry = registry[settings.visualizer];
    const hidden = !settings.showThemeName || !!(entry && entry.fullscreenUi);
    internal.dom.themeBadge.style.display = hidden ? 'none' : 'block';
  }

  function updateUiPosition() {
    internal.dom.body.setAttribute('data-ui-pos', uiPositions[clamp(settings.uiPosition, 0, uiPositions.length - 1)] || 'bl');
  }

  function setTheme(index) {
    const profiles = internal.profiles;
    const nextTheme = clamp(Number(index) || 0, 0, registry.length - 1);
    if (profiles.isReady() && settings.perThemeSettings && nextTheme !== settings.visualizer) {
      profiles.cancelQueuedSave();
      profiles.saveThemeProfile(settings.visualizer);
    }
    settings.visualizer = nextTheme;
    if (profiles.isReady() && settings.perThemeSettings) profiles.restoreThemeProfile(nextTheme);
    applyPreset();
    internal.dom.themeBadge.textContent = registry[settings.visualizer].name.toUpperCase();
    updateBadge();
    internal.nowplaying.updateNowPlaying();
  }

  window.livelyWallpaperPlaybackChanged = function(data) {
    try {
      const s = typeof data === 'string' ? JSON.parse(data) : data;
      if (typeof s === 'boolean') internal.frame.setPaused(!s);
      else if (s && typeof s.IsPaused === 'boolean') internal.frame.setPaused(s.IsPaused);
    } catch {}
  };

  window.livelyPropertyListener = function(name, val) {
    const profiles = internal.profiles;
    const toBool = profiles.toBool;
    let profileSettingChanged = profiles.THEME_PROFILE_KEYS.includes(name);
    switch (name) {
      case 'visualizer':
        profileSettingChanged = false;
        setTheme(val);
        break;
      case 'category': {
        profileSettingChanged = false;
        settings.category = clamp(Number(val) || 0, 0, CATEGORIES.length - 1);
        const list = state.categoryThemes(state.activeCategoryIndex());
        if (!list.includes(settings.visualizer)) setTheme(list[0]);
        internal.frame.resetCycleClock();
        break;
      }
      case 'presetPack': {
        profileSettingChanged = false;
        settings.presetPack = clamp(Number(val) || 0, 0, PRESETS.length - 1);
        const packCategory = PACK_CATEGORIES[settings.presetPack];
        if (packCategory !== undefined) setTheme(state.categoryThemes(packCategory)[0]);
        internal.frame.resetCycleClock();
        break;
      }
      case 'perThemeSettings': {
        profileSettingChanged = false;
        const enabled = toBool(val);
        if (profiles.isReady() && settings.perThemeSettings && !enabled) profiles.saveThemeProfile();
        settings.perThemeSettings = enabled;
        if (profiles.isReady() && enabled) {
          if (profiles.hasProfile()) profiles.restoreThemeProfile(settings.visualizer);
          else profiles.saveThemeProfile();
        }
        break;
      }
      case 'resetThemeSettings':
        profileSettingChanged = false;
        if (profiles.isReady()) profiles.resetCurrentThemeProfile();
        break;
      case 'copyThemeSettings':
        profileSettingChanged = false;
        if (profiles.isReady()) profiles.copyCurrentThemeProfileToAll();
        break;
      case 'sensitivity': settings.sensitivity = clamp(Number(val) / 100, 0.3, 3); break;
      case 'bassBoost': settings.bassBoost = clamp(Number(val) / 100, 0.5, 2.2); break;
      case 'beatPulse': settings.beatPulse = clamp(Number(val) / 100, 0, 2); break;
      case 'smoothing': settings.smoothing = clamp(Number(val) / 100, 0, 0.95); break;
      case 'motionSpeed': settings.motionSpeed = clamp(Number(val) / 100, 0.2, 2.5); break;
      case 'colorSaturation': settings.colorSaturation = clamp(Number(val) / 100, 0, 2); break;
      case 'visualContrast': settings.visualContrast = clamp(Number(val) / 100, 0.5, 1.5); break;
      case 'glow': settings.glow = clamp(Number(val) / 100, 0, 1); break;
      case 'trail': settings.trail = clamp(Number(val) / 100, 0, 0.92); break;
      case 'scanlineStrength': settings.scanlineStrength = clamp(Number(val) / 100, 0, 1); break;
      case 'barCount': settings.barCount = clamp(Number(val), 16, 128); break;
      case 'colorMode': settings.colorMode = clamp(Number(val) || 0, 0, 5); break;
      case 'accent': settings.accent = String(val); break;
      case 'secondary': settings.secondary = String(val); break;
      case 'background': settings.background = clamp(Number(val) || 0, 0, 7); break;
      case 'kaleidoSymmetry': settings.kaleidoSymmetry = clamp(Number(val) || 0, 0, 4); break;
      case 'kaleidoComplexity': settings.kaleidoComplexity = clamp(Number(val) / 100, 0.2, 1); break;
      case 'kaleidoZoom': settings.kaleidoZoom = clamp(Number(val) / 100, 0.6, 1.6); break;
      case 'kaleidoRotation': settings.kaleidoRotation = clamp(Number(val) / 100, -1, 1); break;
      case 'albumArtReactive': settings.albumArtReactive = toBool(val); break;
      case 'albumArtStrength': settings.albumArtStrength = clamp(Number(val) / 100, 0, 1); break;
      case 'beatFlash': settings.beatFlash = toBool(val); break;
      case 'beatFlashStrength': settings.beatFlashStrength = clamp(Number(val) / 100, 0, 0.6); break;
      case 'interactionEnabled': settings.interactionEnabled = toBool(val); break;
      case 'interactionMode': settings.interactionMode = clamp(Number(val) || 0, 0, 2); break;
      case 'interactionStrength': settings.interactionStrength = clamp(Number(val) / 100, 0, 1.5); break;
      case 'ambientMotion': settings.ambientMotion = clamp(Number(val) / 100, 0, 1); break;
      case 'shaderQuality':
        settings.shaderQuality = clamp(Number(val) || 0, 0, 2);
        for (const entry of registry) if (entry.invalidate) entry.invalidate();
        break;
      case 'crtOverlay': settings.crtOverlay = toBool(val); break;
      case 'vignette': settings.vignette = toBool(val); break;
      case 'showTrack': settings.showTrack = toBool(val); internal.nowplaying.updateNowPlaying(); break;
      case 'showThemeName': settings.showThemeName = toBool(val); updateBadge(); break;
      case 'idleMotion': settings.idleMotion = toBool(val); break;
      case 'autoCycle': settings.autoCycle = toBool(val); internal.frame.resetCycleClock(); break;
      case 'cycleSeconds': settings.cycleSeconds = clamp(Number(val), 5, 60); break;
      case 'uiPosition': settings.uiPosition = clamp(Number(val) || 0, 0, 3); updateUiPosition(); break;
      case 'fps': settings.fps = Number(val) === 1 ? 30 : 60; break;
    }
    applyPreset();
    if (profileSettingChanged) profiles.queueThemeProfileSave();
    profiles.queuePropertyInitialization();
  };

  internal.properties = { applyPreset, setTheme, updateBadge, updateUiPosition };
})();
