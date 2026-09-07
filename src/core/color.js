// Color conversion, the active palette cache, and album-art color sampling.
(() => {
  'use strict';

  const { fx, internal } = JuqBawx;
  const { clamp, lerp } = fx;
  const { settings, runtime } = internal.state;

  let paletteCacheDirty = true;
  let cachedPaletteStops = ['#18e0ff', '#43f0ca', '#f8d94a', '#ff6f61', '#b031ff'];
  // Mutated in place so a destructured reference stays valid across a refresh.
  const cachedPaletteRgb = [];
  let cachedPrimaryRgb = { r: 24, g: 224, b: 255 };
  let cachedSecondaryRgb = { r: 176, g: 49, b: 255 };
  const gpuPaletteColors = new Float32Array(15);

  fx.albumPrimary = '#18e0ff';
  fx.albumSecondary = '#b031ff';
  fx.albumArtReady = false;
  fx.albumPalette = ['#18e0ff', '#43f0ca', '#f8d94a', '#ff6f61', '#b031ff'];
  fx.cachedPaletteRgb = cachedPaletteRgb;

  function hexToRgb(hex) {
    const h = String(hex || '').replace('#', '').trim();
    const normalized = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(normalized || '000000', 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgba(hex, a = 1) {
    const c = hexToRgb(hex);
    return `rgba(${c.r},${c.g},${c.b},${a})`;
  }

  function hsl(h, s, l, a = 1) {
    return `hsla(${h},${s}%,${l}%,${a})`;
  }

  function mixHex(a, b, amount) {
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    const t = clamp(amount, 0, 1);
    const r = Math.round(lerp(ca.r, cb.r, t));
    const g = Math.round(lerp(ca.g, cb.g, t));
    const bl = Math.round(lerp(ca.b, cb.b, t));
    return '#' + [r, g, bl].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function toHexChannel(value) {
    return clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0');
  }

  function rgbToHex(r, g, b) {
    return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
  }

  function rgbaFromRgb(color, alpha) {
    return `rgba(${color.r},${color.g},${color.b},${alpha})`;
  }

  function rgbHue(r, g, b) {
    const rr = r / 255, gg = g / 255, bb = b / 255;
    const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
    if (max === min) return 0;
    const d = max - min;
    let hue = max === rr ? ((gg - bb) / d) % 6 : max === gg ? (bb - rr) / d + 2 : (rr - gg) / d + 4;
    if (hue < 0) hue += 6;
    return hue / 6;
  }

  function markPaletteDirty() {
    paletteCacheDirty = true;
  }

  function refreshPaletteCache() {
    if (!paletteCacheDirty) return;
    const useAlbum = runtime.albumArtReactive && fx.albumArtReady;
    cachedPaletteStops = useAlbum
      ? fx.albumPalette
      : [runtime.accent, mixHex(runtime.accent, runtime.secondary, 0.35), runtime.secondary, mixHex(runtime.secondary, '#ffffff', 0.26), runtime.accent];
    cachedPaletteRgb.length = 0;
    for (const stop of cachedPaletteStops) cachedPaletteRgb.push(hexToRgb(stop));
    const primary = useAlbum ? mixHex(runtime.accent, fx.albumPrimary, clamp(runtime.albumArtStrength, 0, 1)) : runtime.accent;
    const secondary = useAlbum ? mixHex(runtime.secondary, fx.albumSecondary, clamp(runtime.albumArtStrength, 0, 1)) : runtime.secondary;
    cachedPrimaryRgb = hexToRgb(primary);
    cachedSecondaryRgb = hexToRgb(secondary);
    for (let index = 0; index < cachedPaletteRgb.length; index++) {
      const color = cachedPaletteRgb[index];
      const offset = index * 3;
      gpuPaletteColors[offset] = color.r / 255;
      gpuPaletteColors[offset + 1] = color.g / 255;
      gpuPaletteColors[offset + 2] = color.b / 255;
    }
    paletteCacheDirty = false;
  }

  function paletteStops() {
    refreshPaletteCache();
    return cachedPaletteStops;
  }

  function cachedPaletteColor(position, alpha) {
    const p = ((position % 1) + 1) % 1 * (cachedPaletteRgb.length - 1);
    const index = Math.min(cachedPaletteRgb.length - 2, Math.floor(p));
    const amount = p - index;
    const c0 = cachedPaletteRgb[index];
    const c1 = cachedPaletteRgb[index + 1];
    const r = Math.round(lerp(c0.r, c1.r, amount));
    const g = Math.round(lerp(c0.g, c1.g, amount));
    const b = Math.round(lerp(c0.b, c1.b, amount));
    return alpha === undefined ? rgbToHex(r, g, b) : `rgba(${r},${g},${b},${alpha})`;
  }

  function colorFromStops(stops, position) {
    if (stops === cachedPaletteStops) return cachedPaletteColor(position);
    const p = ((position % 1) + 1) % 1 * (stops.length - 1);
    const index = Math.min(stops.length - 2, Math.floor(p));
    return mixHex(stops[index], stops[index + 1], p - index);
  }

  function updateDossierPalette() {
    const primary = fx.albumArtReady ? fx.albumPrimary : runtime.accent;
    const secondary = fx.albumArtReady ? fx.albumSecondary : runtime.secondary;
    const el = internal.dom.mediaDossierEl;
    el.style.setProperty('--media-primary', primary || '#79e8ff');
    el.style.setProperty('--media-secondary', secondary || '#b27cff');
  }

  function sampleAlbumColors() {
    const albumArtEl = internal.dom.albumArtEl;
    if (!albumArtEl.naturalWidth || !albumArtEl.naturalHeight) return;
    try {
      const c = document.createElement('canvas');
      c.width = 24;
      c.height = 24;
      const cctx = c.getContext('2d', { willReadFrequently: true });
      cctx.drawImage(albumArtEl, 0, 0, 24, 24);
      const data = cctx.getImageData(0, 0, 24, 24).data;
      let r = 0, g = 0, b = 0, n = 0;
      let br = 0, bg = 0, bb = 0, bestScore = -1;
      const hueBuckets = Array.from({ length: 10 }, () => ({ r: 0, g: 0, b: 0, weight: 0, count: 0, hue: 0 }));
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const rr = data[i], gg = data[i + 1], bl = data[i + 2];
        const maxc = Math.max(rr, gg, bl), minc = Math.min(rr, gg, bl);
        const sat = maxc - minc;
        const lum = (rr + gg + bl) / 3;
        if (lum > 22 && lum < 238) { r += rr; g += gg; b += bl; n++; }
        const score = sat * 1.4 + (255 - Math.abs(lum - 135)) * 0.35;
        if (score > bestScore) { bestScore = score; br = rr; bg = gg; bb = bl; }
        if (lum > 18 && lum < 244) {
          const hue = rgbHue(rr, gg, bl);
          const bucket = hueBuckets[Math.min(hueBuckets.length - 1, Math.floor(hue * hueBuckets.length))];
          const weight = 0.2 + sat / 255;
          bucket.r += rr * weight;
          bucket.g += gg * weight;
          bucket.b += bl * weight;
          bucket.weight += weight;
          bucket.count++;
          bucket.hue = hue;
        }
      }
      if (n) {
        const avgHex = rgbToHex(r / n, g / n, b / n);
        const vividHex = rgbToHex(br, bg, bb);
        fx.albumPrimary = mixHex(vividHex, '#ffffff', 0.12);
        fx.albumSecondary = mixHex(avgHex, runtime.secondary || settings.secondary, 0.35);
        const extracted = hueBuckets
          .filter(bucket => bucket.count && bucket.weight)
          .sort((a, b) => (b.count * b.weight) - (a.count * a.weight))
          .slice(0, 5)
          .sort((a, b) => a.hue - b.hue)
          .map(bucket => rgbToHex(bucket.r / bucket.weight, bucket.g / bucket.weight, bucket.b / bucket.weight));
        const fallback = [fx.albumPrimary, mixHex(fx.albumPrimary, fx.albumSecondary, 0.5), fx.albumSecondary, mixHex(fx.albumSecondary, '#ffffff', 0.24), fx.albumPrimary];
        fx.albumPalette = Array.from({ length: 5 }, (_, index) => extracted[index] || fallback[index]);
        fx.albumArtReady = true;
        paletteCacheDirty = true;
        refreshPaletteCache();
        updateDossierPalette();
      }
    } catch {
      fx.albumArtReady = false;
      paletteCacheDirty = true;
      refreshPaletteCache();
      updateDossierPalette();
    }
  }

  function palette(t, mix = 0, alpha = 1) {
    const mode = runtime.colorMode;
    if (mode === 1) {
      const hue = (t * 0.03 + mix * 230) % 360;
      return hsl(hue, 92, 58, alpha);
    }
    if (mode === 2) {
      const hue = 110 + mix * 35;
      return hsl(hue, 88, 52 - mix * 10, alpha);
    }
    if (mode === 3) {
      const hue = (18 + mix * 305) % 360;
      return hsl(hue, 94, 58, alpha);
    }
    if (mode === 4) {
      const hue = mix < 0.5 ? 195 + mix * 40 : 18 + (mix - 0.5) * 60;
      return hsl(hue, 94, mix < 0.5 ? 62 : 56, alpha);
    }
    refreshPaletteCache();
    if (mode === 5) return cachedPaletteColor(mix, alpha);
    return rgbaFromRgb(mix < 0.5 ? cachedPrimaryRgb : cachedSecondaryRgb, alpha);
  }

  function baseBgColor() {
    return ['#05060a', '#030814', '#130611', '#0a0713', '#000000', '#111317', '#05101d', '#030d04'][runtime.background] || '#05060a';
  }

  internal.color = {
    hexToRgb, rgba, hsl, mixHex, rgbToHex, rgbHue, colorFromStops,
    refreshPaletteCache, markPaletteDirty, updateDossierPalette, sampleAlbumColors,
    gpuPaletteColors
  };

  fx.palette = palette;
  fx.paletteStops = paletteStops;
  fx.refreshPaletteCache = refreshPaletteCache;
  fx.rgba = rgba;
  fx.baseBgColor = baseBgColor;
  fx.colorFromStops = colorFromStops;
})();
