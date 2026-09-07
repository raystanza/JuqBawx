'use strict';
// Loads the wallpaper under Node with a mocked DOM, using index.html's own
// script tags as the manifest so the test and the browser load the same files
// in the same order. Shared by smoke-test.cjs and sync-properties.cjs.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function createHarness({ mockWebGl = false } = {}) {
  const counters = { gpuDrawCalls: 0, gpuProgramsCreated: 0, cpuShaderUploads: 0 };
  const canvasCalls = Object.create(null);
  const countedContextMethods = new Set(['arc', 'drawImage', 'fill', 'fillRect', 'fillText', 'rect', 'stroke']);
  const gradients = { addColorStop() {} };

  const context = new Proxy({}, {
    get(target, property) {
      if (property === 'createLinearGradient' || property === 'createRadialGradient') return () => gradients;
      if (property === 'createImageData') return (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) });
      if (property === 'putImageData') return () => { counters.cpuShaderUploads++; };
      if (property === 'getImageData') {
        return (x, y, width, height) => {
          const data = new Uint8ClampedArray(width * height * 4);
          for (let index = 0; index < data.length; index += 4) {
            data[index] = (index / 4 * 31) % 255;
            data[index + 1] = (index / 4 * 67) % 255;
            data[index + 2] = (index / 4 * 113) % 255;
            data[index + 3] = 255;
          }
          return { data };
        };
      }
      if (countedContextMethods.has(property)) {
        if (!(property in target)) target[property] = () => { canvasCalls[property] = (canvasCalls[property] || 0) + 1; };
        return target[property];
      }
      if (!(property in target)) target[property] = () => {};
      return target[property];
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    }
  });

  const webGlContext = {
    VERTEX_SHADER: 0x8B31,
    FRAGMENT_SHADER: 0x8B30,
    COMPILE_STATUS: 0x8B81,
    LINK_STATUS: 0x8B82,
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88E4,
    FLOAT: 0x1406,
    BLEND: 0x0BE2,
    TRIANGLES: 0x0004,
    createShader: () => ({}),
    shaderSource() {},
    compileShader() {},
    getShaderParameter: () => true,
    getShaderInfoLog: () => '',
    deleteShader() {},
    createProgram: () => { counters.gpuProgramsCreated++; return {}; },
    attachShader() {},
    linkProgram() {},
    getProgramParameter: () => true,
    getProgramInfoLog: () => '',
    deleteProgram() {},
    getAttribLocation: () => 0,
    createBuffer: () => ({}),
    bindBuffer() {},
    bufferData() {},
    enableVertexAttribArray() {},
    vertexAttribPointer() {},
    useProgram() {},
    disable() {},
    getUniformLocation: () => ({}),
    viewport() {},
    isContextLost: () => false,
    uniform2f() {},
    uniform1f() {},
    uniform3f() {},
    uniform4f() {},
    uniform3fv() {},
    drawArrays() { counters.gpuDrawCalls++; }
  };

  function element() {
    const style = { setProperty(name, value) { this[name] = value; } };
    const classes = new Set();
    return {
      style,
      classes,
      classList: {
        toggle(name, force) {
          const on = force === undefined ? !classes.has(name) : !!force;
          if (on) classes.add(name); else classes.delete(name);
          return on;
        },
        contains: name => classes.has(name)
      },
      attributes: {},
      setAttribute(name, value) { this.attributes[name] = value; },
      getContext: type => type === 'webgl' ? (mockWebGl ? webGlContext : null) : context,
      naturalWidth: 0,
      naturalHeight: 0,
      complete: false,
      textContent: ''
    };
  }

  const elementIds = [
    'visualizer', 'nowPlaying', 'albumArt', 'artFallback', 'trackTitle', 'trackArtist', 'trackAlbum',
    'themeBadge', 'mediaDossier', 'dossierAlbumArt', 'dossierArtFallback', 'dossierStateLabel',
    'dossierPlaybackBadge', 'dossierTitle', 'dossierArtist', 'dossierAlbum', 'dossierAlbumArtist',
    'dossierTrackNumber', 'dossierGenres', 'dossierPlaybackType', 'dossierSubtitle',
    'dossierArtworkState', 'dossierAvailability'
  ];
  const elements = new Map(elementIds.map(id => [id, element()]));

  const albumArt = elements.get('albumArt');
  Object.defineProperty(albumArt, 'src', {
    set(value) {
      this._src = value;
      this.naturalWidth = 600;
      this.naturalHeight = 600;
      this.complete = true;
      if (typeof this.onload === 'function') this.onload();
    },
    get() { return this._src || ''; }
  });

  const frames = [];
  const storage = new Map();
  const listeners = new Map();

  global.window = global;
  global.innerWidth = 1280;
  global.innerHeight = 720;
  global.devicePixelRatio = 1;
  global.document = {
    body: element(),
    getElementById: id => elements.get(id),
    createElement: () => element(),
    addEventListener: (name, callback) => listeners.set(`document:${name}`, callback)
  };
  global.localStorage = {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value)
  };
  global.addEventListener = (name, callback) => listeners.set(name, callback);
  global.requestAnimationFrame = callback => { frames.push(callback); return frames.length; };

  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const scripts = [...indexHtml.matchAll(/<script\s+src="([^"]+)"><\/script>/g)].map(match => match[1]);
  if (!scripts.length) throw new Error('No script tags were found in index.html');
  for (const src of scripts) {
    const file = path.join(ROOT, src);
    if (!fs.existsSync(file)) throw new Error(`index.html references a missing file: ${src}`);
    require(file);
  }

  return {
    root: ROOT,
    scripts,
    elements,
    listeners,
    frames,
    counters,
    canvasCalls,
    countedContextMethods,
    JuqBawx: global.JuqBawx
  };
}

module.exports = { createHarness, ROOT };
