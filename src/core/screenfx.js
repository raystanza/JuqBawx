// Post-processing drawn over every visualizer: CRT scanlines, beat flash, vignette.
(() => {
  'use strict';

  const { fx, internal } = JuqBawx;
  const { clamp } = fx;
  const { runtime } = internal.state;

  const scanlineCanvas = document.createElement('canvas');
  const scanlineCtx = scanlineCanvas.getContext('2d', { alpha: true });

  let scanlineStrengthCache = -1;
  let scanlinePattern = null;
  let vignetteGradient = null;

  function invalidate() {
    scanlinePattern = null;
    scanlineStrengthCache = -1;
    vignetteGradient = null;
  }

  function ensureScanlinePattern() {
    const ctx = fx.ctx;
    const strength = runtime.scanlineStrength;
    if (scanlinePattern && scanlineStrengthCache === strength) return;
    scanlineCanvas.width = 1;
    scanlineCanvas.height = 3;
    scanlineCtx.clearRect(0, 0, 1, 3);
    scanlineCtx.fillStyle = `rgba(0,0,0,${0.02 + strength * 0.08})`;
    scanlineCtx.fillRect(0, 0, 1, 1);
    scanlinePattern = ctx.createPattern(scanlineCanvas, 'repeat');
    scanlineStrengthCache = strength;
  }

  function ensureVignetteGradient() {
    const { ctx, width, height } = fx;
    if (vignetteGradient) return;
    vignetteGradient = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.2, width / 2, height / 2, Math.max(width, height) * 0.72);
    vignetteGradient.addColorStop(0, 'rgba(0,0,0,0)');
    vignetteGradient.addColorStop(0.72, 'rgba(0,0,0,0.04)');
    vignetteGradient.addColorStop(1, 'rgba(0,0,0,0.22)');
  }

  function drawScreenFx(t) {
    const { ctx, width, height, beat, palette } = fx;
    if (runtime.crtOverlay) {
      const strength = runtime.scanlineStrength;
      ctx.globalCompositeOperation = 'source-over';
      ensureScanlinePattern();
      if (scanlinePattern) {
        ctx.fillStyle = scanlinePattern;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.fillStyle = `rgba(255,255,255,${0.015 + strength * 0.02})`;
      ctx.fillRect(0, 0, width, 2);
      ctx.fillStyle = `rgba(255,255,255,${0.006 + 0.01 * Math.sin(t * 0.002)})`;
      ctx.fillRect(0, height * 0.12 + Math.sin(t * 0.0018) * 20, width, 2);
    }
    if (runtime.beatFlash && beat > 0.08) {
      const flash = clamp(beat * runtime.beatFlashStrength * runtime.beatPulse * 0.2, 0, 0.22);
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = palette(t, 0.2, flash);
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (runtime.vignette) {
      ensureVignetteGradient();
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, width, height);
    }
  }

  internal.screenfx = { drawScreenFx, invalidate };
})();
