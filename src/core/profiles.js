// Per-sub-theme customization profiles, keyed by visualizer id.
//
// v2 stored profiles under the numeric dropdown index, so removing or reordering
// a visualizer silently applied one visualizer's settings to another. v3 keys by
// id; v2 payloads are ignored rather than migrated.
(() => {
  'use strict';

  const { fx, internal, registry } = JuqBawx;
  const { clamp } = fx;
  const { settings, DEFAULT_SETTINGS } = internal.state;

  const THEME_PROFILE_STORAGE_KEY = 'jukebox-theme-profiles-v3';
  const THEME_PROFILE_KEYS = [
    'sensitivity', 'bassBoost', 'beatPulse', 'smoothing', 'motionSpeed', 'colorSaturation', 'visualContrast',
    'glow', 'trail', 'scanlineStrength', 'barCount', 'colorMode', 'accent', 'secondary', 'background',
    'kaleidoSymmetry', 'kaleidoComplexity', 'kaleidoZoom', 'kaleidoRotation',
    'albumArtReactive', 'albumArtStrength', 'beatFlash', 'beatFlashStrength',
    'interactionEnabled', 'interactionMode', 'interactionStrength', 'ambientMotion', 'shaderQuality',
    'crtOverlay', 'vignette', 'idleMotion'
  ];
  const PROFILE_RANGES = {
    sensitivity: [0.3, 3], bassBoost: [0.5, 2.2], beatPulse: [0, 2], smoothing: [0, 0.95],
    motionSpeed: [0.2, 2.5], colorSaturation: [0, 2], visualContrast: [0.5, 1.5], glow: [0, 1],
    trail: [0, 0.92], scanlineStrength: [0, 1], barCount: [16, 128], colorMode: [0, 5], background: [0, 7],
    kaleidoSymmetry: [0, 4], kaleidoComplexity: [0.2, 1], kaleidoZoom: [0.6, 1.6], kaleidoRotation: [-1, 1],
    albumArtStrength: [0, 1], beatFlashStrength: [0, 0.6], interactionMode: [0, 2],
    interactionStrength: [0, 1.5], ambientMotion: [0, 1], shaderQuality: [0, 2]
  };
  const PROFILE_INTEGER_KEYS = new Set([
    'barCount', 'colorMode', 'background', 'kaleidoSymmetry', 'interactionMode', 'shaderQuality'
  ]);
  const PROFILE_COLOR_KEYS = new Set(['accent', 'secondary']);
  const PROFILE_BOOLEAN_KEYS = new Set([
    'albumArtReactive', 'beatFlash', 'interactionEnabled', 'crtOverlay', 'vignette', 'idleMotion'
  ]);

  let themeProfiles = {};
  let themeProfileDefaults = null;
  let propertiesReady = false;
  let propertyInitTimer = 0;
  let profileSaveTimer = 0;

  function toBool(val) {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val !== 0;
    if (typeof val === 'string') return !['false', '0', 'off', 'no', ''].includes(val.toLowerCase());
    return Boolean(val);
  }

  function profileKey(index = settings.visualizer) {
    const entry = registry[index];
    return entry ? entry.id : null;
  }

  function cleanThemeProfile(source) {
    if (!source || typeof source !== 'object') return null;
    const profile = {};
    for (const key of THEME_PROFILE_KEYS) {
      if (!(key in source)) continue;
      const value = source[key];
      if (PROFILE_COLOR_KEYS.has(key)) {
        if (/^#[0-9a-f]{6}$/i.test(String(value))) profile[key] = String(value);
        continue;
      }
      if (PROFILE_BOOLEAN_KEYS.has(key)) {
        profile[key] = toBool(value);
        continue;
      }
      const range = PROFILE_RANGES[key];
      const number = Number(value);
      if (!range || !Number.isFinite(number)) continue;
      const safeNumber = clamp(number, range[0], range[1]);
      profile[key] = PROFILE_INTEGER_KEYS.has(key) ? Math.round(safeNumber) : safeNumber;
    }
    return Object.keys(profile).length ? profile : null;
  }

  function captureThemeProfile(source = settings) {
    const profile = {};
    for (const key of THEME_PROFILE_KEYS) profile[key] = source[key];
    return cleanThemeProfile(profile);
  }

  function readThemeProfiles() {
    try {
      const raw = localStorage.getItem(THEME_PROFILE_STORAGE_KEY);
      if (!raw) return {};
      const payload = JSON.parse(raw);
      const storedProfiles = payload && payload.profiles && typeof payload.profiles === 'object' ? payload.profiles : {};
      const profiles = {};
      for (const entry of registry) {
        const profile = cleanThemeProfile(storedProfiles[entry.id]);
        if (profile) profiles[entry.id] = profile;
      }
      return profiles;
    } catch {
      return {};
    }
  }

  function writeThemeProfiles() {
    try {
      localStorage.setItem(THEME_PROFILE_STORAGE_KEY, JSON.stringify({ version: 3, profiles: themeProfiles }));
    } catch {
      // Lively can run its web player with disk storage disabled; profiles still work for this session.
    }
  }

  function saveThemeProfile(index = settings.visualizer) {
    if (!settings.perThemeSettings) return;
    const key = profileKey(index);
    if (!key) return;
    themeProfiles[key] = captureThemeProfile();
    writeThemeProfiles();
  }

  function queueThemeProfileSave() {
    if (!propertiesReady || !settings.perThemeSettings) return;
    clearTimeout(profileSaveTimer);
    profileSaveTimer = setTimeout(() => saveThemeProfile(), 140);
  }

  function hasProfile(index = settings.visualizer) {
    const key = profileKey(index);
    return !!(key && themeProfiles[key]);
  }

  function restoreThemeProfile(index) {
    if (themeProfileDefaults) Object.assign(settings, themeProfileDefaults);
    const key = profileKey(index);
    const profile = key ? cleanThemeProfile(themeProfiles[key]) : null;
    if (profile) Object.assign(settings, profile);
  }

  function resetCurrentThemeProfile() {
    const profile = captureThemeProfile(DEFAULT_SETTINGS);
    const key = profileKey();
    if (key) themeProfiles[key] = profile;
    Object.assign(settings, profile);
    writeThemeProfiles();
    internal.properties.applyPreset();
  }

  function copyCurrentThemeProfileToAll() {
    const profile = captureThemeProfile();
    for (const entry of registry) themeProfiles[entry.id] = { ...profile };
    writeThemeProfiles();
  }

  function finishPropertyInitialization() {
    if (propertiesReady) return;
    propertiesReady = true;
    themeProfileDefaults = captureThemeProfile();
    if (settings.perThemeSettings) {
      if (hasProfile()) restoreThemeProfile(settings.visualizer);
      else saveThemeProfile(settings.visualizer);
    }
    internal.properties.applyPreset();
  }

  function queuePropertyInitialization() {
    if (propertiesReady) return;
    clearTimeout(propertyInitTimer);
    propertyInitTimer = setTimeout(finishPropertyInitialization, 160);
  }

  function cancelQueuedSave() {
    clearTimeout(profileSaveTimer);
  }

  internal.profiles = {
    THEME_PROFILE_KEYS,
    toBool,
    load() { themeProfiles = readThemeProfiles(); },
    isReady: () => propertiesReady,
    hasProfile,
    saveThemeProfile,
    queueThemeProfileSave,
    cancelQueuedSave,
    restoreThemeProfile,
    resetCurrentThemeProfile,
    copyCurrentThemeProfileToAll,
    queuePropertyInitialization
  };
})();
