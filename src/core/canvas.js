// The main surface: sizing, background clearing, album-art backdrop, and the
// shared drawing helpers every visualizer builds on.
(() => {
  'use strict';

  const { fx, internal, registry } = JuqBawx;
  const { clamp } = fx;
  const { runtime } = internal.state;

  const albumBackdropCanvas = document.createElement('canvas');
  const albumBackdropCtx = albumBackdropCanvas.getContext('2d', { alpha: true, desynchronized: true });

  let albumArtVersion = 0;
  let albumBackdropSignature = '';
  let albumTintSignature = '';
  let albumTintGradient = null;

  const RENDER_DPR_CAPS = [1, 1.5, 2];
  const RENDER_SCALES = [0.62, 0.82, 1];

  fx.width = 0;
  fx.height = 0;
  fx.dpr = 1;

  function renderScaleForQuality() {
    const level = clamp(Math.round(runtime.shaderQuality), 0, RENDER_SCALES.length - 1);
    const capped = Math.min(window.devicePixelRatio || 1, RENDER_DPR_CAPS[level]);
    return Math.max(0.4, capped * RENDER_SCALES[level]);
  }

  function refreshRenderScale() {
    if (!fx.width || !fx.height) return;
    if (Math.abs(renderScaleForQuality() - fx.dpr) < 0.001) return;
    resize();
  }

  function resize() {
    const canvas = internal.dom.canvas;
    const ctx = fx.ctx;
    fx.dpr = renderScaleForQuality();
    fx.width = innerWidth;
    fx.height = innerHeight;
    canvas.width = Math.round(fx.width * fx.dpr);
    canvas.height = Math.round(fx.height * fx.dpr);
    canvas.style.width = fx.width + 'px';
    canvas.style.height = fx.height + 'px';
    ctx.setTransform(fx.dpr, 0, 0, fx.dpr, 0, 0);

    internal.fields.rebuild();
    for (const entry of registry) {
      if (entry.resize) entry.resize(fx);
      if (entry.invalidate) entry.invalidate();
    }

    albumBackdropSignature = '';
    albumTintSignature = '';
    internal.screenfx.invalidate();
  }

  function invalidateAlbumBackdrop() {
    albumArtVersion++;
    albumBackdropSignature = '';
  }

  function trailAlpha(base = 1) {
    return clamp(base * (1 - runtime.trail * 0.88), 0.05, 1);
  }

  function ensureAlbumBackdrop() {
    const albumArtEl = internal.dom.albumArtEl;
    const { width, height } = fx;
    const signature = `${albumArtVersion}:${width}:${height}:${albumArtEl.naturalWidth}:${albumArtEl.naturalHeight}`;
    if (signature === albumBackdropSignature) return;
    const longSide = Math.max(width, height);
    const renderScale = Math.min(1, 640 / Math.max(1, longSide));
    const renderWidth = Math.max(1, Math.round(width * renderScale));
    const renderHeight = Math.max(1, Math.round(height * renderScale));
    albumBackdropCanvas.width = renderWidth;
    albumBackdropCanvas.height = renderHeight;
    const iw = albumArtEl.naturalWidth;
    const ih = albumArtEl.naturalHeight;
    const scale = Math.max(renderWidth / iw, renderHeight / ih) * 1.18;
    const dw = iw * scale;
    const dh = ih * scale;
    albumBackdropCtx.setTransform(1, 0, 0, 1, 0, 0);
    albumBackdropCtx.clearRect(0, 0, renderWidth, renderHeight);
    albumBackdropCtx.filter = `blur(${Math.max(2, 34 * renderScale)}px) saturate(1.35) contrast(1.08)`;
    albumBackdropCtx.drawImage(albumArtEl, (renderWidth - dw) / 2, (renderHeight - dh) / 2, dw, dh);
    albumBackdropCtx.filter = 'none';
    albumBackdropSignature = signature;
  }

  function ensureAlbumTint() {
    const { width, height, ctx, rgba } = fx;
    const signature = `${width}:${height}:${fx.albumPrimary}:${fx.albumSecondary}:${runtime.albumArtStrength}`;
    if (signature === albumTintSignature && albumTintGradient) return;
    albumTintGradient = ctx.createLinearGradient(0, 0, width, height);
    albumTintGradient.addColorStop(0, rgba(fx.albumPrimary, runtime.albumArtStrength * 0.06));
    albumTintGradient.addColorStop(1, rgba(fx.albumSecondary, runtime.albumArtStrength * 0.08));
    albumTintSignature = signature;
  }

  function drawAlbumArtBackdrop() {
    const albumArtEl = internal.dom.albumArtEl;
    const { ctx, width, height } = fx;
    if (!runtime.albumArtReactive || !fx.albumArtReady || !albumArtEl.naturalWidth) return;
    ensureAlbumBackdrop();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = clamp(runtime.albumArtStrength * 0.22, 0, 0.24);
    ctx.drawImage(albumBackdropCanvas, 0, 0, width, height);
    ctx.restore();
    ensureAlbumTint();
    ctx.fillStyle = albumTintGradient;
    ctx.fillRect(0, 0, width, height);
  }

  function clearBackground(alpha = 1) {
    const { ctx, width, height } = fx;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = fx.baseBgColor();
    ctx.globalAlpha = trailAlpha(alpha);
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
    drawAlbumArtBackdrop();
  }

  function roundedRect(x, y, w, h, r) {
    const ctx = fx.ctx;
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function backdropGlow(t, amount = 1) {
    const { ctx, width, height, palette, bass, energy } = fx;
    const cx = width * 0.5;
    const cy = height * 0.55;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.62);
    g.addColorStop(0, palette(t, 0.15, (0.08 + energy() * 0.12) * amount));
    g.addColorStop(0.45, palette(t, 0.85, (0.05 + bass() * 0.08) * amount));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }

  function pulse(mult = 1) {
    return 1 + fx.beat * runtime.beatPulse * mult;
  }

  internal.canvas = { resize, refreshRenderScale, drawAlbumArtBackdrop, invalidateAlbumBackdrop };

  fx.clearBackground = clearBackground;
  fx.trailAlpha = trailAlpha;
  fx.roundedRect = roundedRect;
  fx.backdropGlow = backdropGlow;
  fx.pulse = pulse;
  fx.drawAlbumArtBackdrop = drawAlbumArtBackdrop;
})();
