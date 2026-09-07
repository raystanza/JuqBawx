(() => {
  'use strict';

  JuqBawx.register({
    id: 'orbiting-orbs',
    name: 'Orbiting Orbs',
    categories: ['modern', 'ambient', 'album', 'interactive'],
    draw(fx, t) {
      const { ctx, width, height, runtime, bass, beat, resample, palette, rgba, clearBackground, TAU } = fx;
      clearBackground(0.22);
      const cx = width / 2;
      const cy = height / 2;
      const vals = resample(18);
      ctx.globalCompositeOperation = 'lighter';
      vals.forEach((v, i) => {
        const a = t * 0.0003 * (1 + i * 0.015) + (i / vals.length) * TAU;
        const orbit = Math.min(width, height) * (0.08 + i * 0.018) * (1 + bass() * 0.65 + beat * runtime.beatPulse * 0.18);
        const x = cx + Math.cos(a + Math.sin(t * 0.0004 + i)) * orbit;
        const y = cy + Math.sin(a * 1.2) * orbit * 0.72;
        const r = 10 + v * 46 + beat * runtime.beatPulse * 14;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, palette(t, i / vals.length, 0.95));
        g.addColorStop(0.45, palette(t, i / vals.length, 0.34));
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
