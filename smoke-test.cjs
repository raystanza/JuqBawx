'use strict';

const { createHarness } = require('./tools/headless.cjs');

const mockWebGl = process.env.MOCK_WEBGL === '1';
const harness = createHarness({ mockWebGl });
const { window, elements, listeners, frames, counters, canvasCalls, countedContextMethods, scripts, JuqBawx } = harness;
const { registry, internal } = JuqBawx;
const properties = require('./LivelyProperties.json');

// --- Registry integrity -----------------------------------------------------

const ids = new Set();
for (const entry of registry) {
  if (ids.has(entry.id)) throw new Error(`Duplicate visualizer id: ${entry.id}`);
  ids.add(entry.id);
  if (typeof entry.draw !== 'function') throw new Error(`Visualizer ${entry.id} has no draw function`);
  if (!entry.name) throw new Error(`Visualizer ${entry.id} has no name`);
}
if (!scripts.includes('src/boot.js')) throw new Error('index.html does not load src/boot.js');

if (registry.length !== properties.visualizer.items.length) {
  throw new Error(`Registry has ${registry.length} visualizers but LivelyProperties lists ${properties.visualizer.items.length}; run node tools/sync-properties.cjs`);
}
registry.forEach((entry, index) => {
  if (properties.visualizer.items[index] !== entry.label) {
    throw new Error(`LivelyProperties item ${index} is "${properties.visualizer.items[index]}" but the registry has "${entry.label}"; run node tools/sync-properties.cjs`);
  }
});

const { CATEGORIES } = internal.state;
if (properties.category.items.length !== CATEGORIES.length) {
  throw new Error('LivelyProperties category inventory is out of sync with the category taxonomy');
}
CATEGORIES.forEach((category, index) => {
  if (properties.category.items[index] !== category.label) {
    throw new Error(`LivelyProperties category ${index} is out of sync with the taxonomy; run node tools/sync-properties.cjs`);
  }
});
for (const entry of registry) {
  for (const category of entry.categories) {
    if (!CATEGORIES.some(item => item.id === category)) {
      throw new Error(`Visualizer ${entry.id} declares unknown category "${category}"`);
    }
  }
}
for (let index = 1; index < CATEGORIES.length; index++) {
  if (!internal.state.categoryThemes(index).length) {
    throw new Error(`Category "${CATEGORIES[index].id}" has no visualizers`);
  }
}

// --- Media session ----------------------------------------------------------

listeners.get('pointermove')({ clientX: 840, clientY: 260 });
listeners.get('pointerdown')({ clientX: 840, clientY: 260 });
window.livelyCurrentTrack({
  Title: 'Smoke Test',
  Artist: 'JuqBawx',
  AlbumArtist: 'JuqBawx Ensemble',
  AlbumTitle: 'Runtime Verification',
  AlbumTrackCount: 12,
  Genres: ['Electronic', 'Test Signal'],
  PlaybackType: 'Video',
  Subtitle: 'Visualizer verification clip',
  TrackNumber: 7,
  Thumbnail: 'AA=='
});
if (elements.get('dossierTitle').textContent !== 'Smoke Test') throw new Error('Dossier title was not populated');
if (elements.get('dossierPlaybackType').textContent !== 'Video') throw new Error('Dossier media type was not populated');
if (elements.get('dossierTrackNumber').textContent !== 'Track 7 of 12') throw new Error('Dossier track position was not formatted');
if (elements.get('dossierGenres').textContent !== 'Electronic · Test Signal') throw new Error('Dossier genres were not formatted');
window.livelyAudioListener(Array.from({ length: 128 }, (_, index) => 0.08 + (index % 17) / 35));

// --- The full-screen dossier overlay ----------------------------------------

// The dossier is a DOM overlay. styles.css only shows it when .active is set,
// and the canvas just paints a glow behind it, so selecting it has to toggle
// that class, hide the Now Playing card, and hide the theme badge.
const dossierIndex = registry.findIndex(entry => entry.fullscreenUi);
if (dossierIndex < 0) throw new Error('No visualizer declares fullscreenUi; the dossier overlay can never activate');

const dossierEl = elements.get('mediaDossier');
const nowPlayingEl = elements.get('nowPlaying');

window.livelyPropertyListener('showThemeName', true);
window.livelyPropertyListener('visualizer', dossierIndex);
if (!dossierEl.classList.contains('active')) {
  throw new Error('Selecting the Now Playing Dossier did not add .active to the overlay, so it stays invisible');
}
if (dossierEl.attributes['aria-hidden'] !== 'false') throw new Error('The dossier overlay stayed aria-hidden while active');
if (!nowPlayingEl.classList.contains('hidden')) throw new Error('The Now Playing card was left visible over the dossier');
if (elements.get('themeBadge').style.display !== 'none') throw new Error('The theme badge was left visible over the dossier');

window.livelyPropertyListener('visualizer', 0);
if (dossierEl.classList.contains('active')) throw new Error('Leaving the dossier did not remove .active');
window.livelyPropertyListener('showThemeName', false);

// --- Render every visualizer ------------------------------------------------

// Draw-call budgets, keyed by id so reordering or removing a visualizer cannot
// silently move a budget onto a different scene.
const BUDGETS = {
  'skyline-pulse': { fillRect: 70 },
  'kaleidoscope-bloom': { fill: 90, drawImage: 20 },
  'galactic-equalizer': { fillRect: 235 }
};
for (const id of Object.keys(BUDGETS)) {
  if (!ids.has(id)) throw new Error(`Budget declared for unknown visualizer "${id}"`);
}

let now = 100;
registry.forEach((entry, index) => {
  window.livelyPropertyListener('visualizer', index);
  window.livelyPropertyListener('interactionMode', index % 3);
  if (entry.id === 'liquid-chrome') window.livelyPropertyListener('shaderQuality', 2);
  if (entry.id === 'album-mosaic') window.livelyPropertyListener('colorMode', 5);
  const draw = frames.shift();
  if (typeof draw !== 'function') throw new Error(`Visualizer ${entry.id} did not schedule a frame`);
  for (const operation of countedContextMethods) canvasCalls[operation] = 0;
  draw(now += 20);
  const budget = BUDGETS[entry.id];
  if (budget) {
    for (const [operation, limit] of Object.entries(budget)) {
      if (canvasCalls[operation] > limit) {
        throw new Error(`${entry.name} exceeded its ${operation} budget (${canvasCalls[operation]} > ${limit})`);
      }
    }
  }
});

for (let pack = 5; pack < properties.presetPack.items.length; pack++) {
  window.livelyPropertyListener('presetPack', pack);
  const draw = frames.shift();
  if (typeof draw !== 'function') throw new Error(`Preset pack ${pack} did not schedule a frame`);
  draw(now += 20);
}

// --- Category selection and auto-cycle --------------------------------------

const { settings } = internal.state;
window.livelyPropertyListener('presetPack', 0);
for (let category = 0; category < CATEGORIES.length; category++) {
  window.livelyPropertyListener('category', category);
  const allowed = internal.state.categoryThemes(internal.state.activeCategoryIndex());
  if (!allowed.includes(settings.visualizer)) {
    throw new Error(`Selecting category "${CATEGORIES[category].id}" left visualizer ${settings.visualizer} outside it`);
  }
  const entry = registry[settings.visualizer];
  if (category > 0 && !entry.categories.includes(CATEGORIES[category].id)) {
    throw new Error(`Visualizer ${entry.id} does not declare category "${CATEGORIES[category].id}"`);
  }
}

window.livelyPropertyListener('category', 0);
window.livelyPropertyListener('visualizer', 0);
window.livelyPropertyListener('cycleSeconds', 5);
window.livelyPropertyListener('autoCycle', true);
const beforeCycle = settings.visualizer;
frames.length = 0;
internal.frame.start();
frames.shift()(now += 6000);
if (settings.visualizer === beforeCycle) throw new Error('Auto-cycle did not advance the visualizer');
window.livelyPropertyListener('autoCycle', false);

// --- Profiles are keyed by id, not by dropdown position ---------------------

// Restoring a profile waits on property initialization, which settles on a
// 160ms timer. Wait for it here the same way the wallpaper does.
async function verifyProfiles() {
  window.livelyPropertyListener('perThemeSettings', true);
  await new Promise(resolve => setTimeout(resolve, 300));
  if (!internal.profiles.isReady()) throw new Error('Property initialization never settled');

  const firstId = registry[0].id;
  const secondId = registry[1].id;

  window.livelyPropertyListener('visualizer', 0);
  window.livelyPropertyListener('glow', 11);
  internal.profiles.saveThemeProfile(0);
  window.livelyPropertyListener('visualizer', 1);
  window.livelyPropertyListener('glow', 88);
  internal.profiles.saveThemeProfile(1);

  const stored = JSON.parse(window.localStorage.getItem('jukebox-theme-profiles-v3'));
  if (stored.version !== 3) throw new Error('Profiles were not written with the v3 schema');
  if (!stored.profiles[firstId] || !stored.profiles[secondId]) {
    throw new Error('Profiles were not keyed by visualizer id');
  }
  if (Object.keys(stored.profiles).some(key => /^\d+$/.test(key))) {
    throw new Error('A profile was stored under a numeric index');
  }
  if (Math.abs(stored.profiles[firstId].glow - 0.11) > 1e-9) throw new Error('First profile did not round-trip');
  if (Math.abs(stored.profiles[secondId].glow - 0.88) > 1e-9) throw new Error('Second profile did not round-trip');

  window.livelyPropertyListener('visualizer', 0);
  if (Math.abs(settings.glow - 0.11) > 1e-9) throw new Error('Switching back did not restore the saved profile');
  window.livelyPropertyListener('visualizer', 1);
  if (Math.abs(settings.glow - 0.88) > 1e-9) throw new Error('Each visualizer did not keep its own profile');

  internal.profiles.copyCurrentThemeProfileToAll();
  const copied = JSON.parse(window.localStorage.getItem('jukebox-theme-profiles-v3'));
  if (Object.keys(copied.profiles).length !== registry.length) {
    throw new Error('Copy-to-all did not cover every visualizer');
  }
  internal.profiles.resetCurrentThemeProfile();
  if (Math.abs(settings.glow - internal.state.DEFAULT_SETTINGS.glow) > 1e-9) {
    throw new Error('Resetting the current sub-theme did not restore defaults');
  }
}

// --- Selective WebGL --------------------------------------------------------

// Skyline Pulse, Kaleidoscope Bloom, Galactic Equalizer, and Liquid Chrome.
const GPU_SCENE_COUNT = 4;

verifyProfiles().then(() => {
  if (mockWebGl && counters.gpuProgramsCreated < GPU_SCENE_COUNT) throw new Error('Not all selective WebGL programs were compiled');
  if (mockWebGl && counters.gpuDrawCalls < GPU_SCENE_COUNT) throw new Error('Not all selective WebGL visualizers used the GPU renderer');
  if (!mockWebGl && counters.cpuShaderUploads < 1) throw new Error('Liquid Chrome did not use the CPU fallback');

  process.stdout.write([
    `PASS - ${mockWebGl ? `${GPU_SCENE_COUNT} WebGL programs` : 'Canvas and CPU shader fallbacks'}`,
    `  ${scripts.length} scripts loaded from index.html`,
    `  ${registry.length} visualizers rendered, every draw-call budget held`,
    '  registry matches LivelyProperties and the category taxonomy',
    '  categories, auto-cycle, id-keyed profiles, the dossier and every pack exercised',
    ''
  ].join('\n'));
  process.exit(0);
}).catch(error => {
  process.stderr.write(`${error.stack}\n`);
  process.exit(1);
});
