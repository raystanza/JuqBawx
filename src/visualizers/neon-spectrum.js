(() => {
  'use strict';

  JuqBawx.register({
    id: 'neon-spectrum',
    name: 'Neon Spectrum',
    categories: ['modern'],
    draw(fx, t) {
      const { ctx, width, height, runtime, resample, palette, clearBackground, backdropGlow, roundedRect, pulse } = fx;
      clearBackground();
      backdropGlow(t, 1.1);
      const vals = resample(runtime.barCount);
      const gap = Math.max(2, width / (vals.length * 5));
      const barW = (width - gap * (vals.length + 1)) / vals.length;
      const maxH = height * 0.72 * pulse(0.18);
      ctx.shadowBlur = 10 + runtime.glow * 28;
      vals.forEach((v, i) => {
        const h = Math.max(2, v * maxH);
        const x = gap + i * (barW + gap);
        ctx.fillStyle = palette(t, i / vals.length, 0.42 + v * 0.45);
        ctx.shadowColor = palette(t, i / vals.length, 1);
        roundedRect(x, height - h - 24, barW, h, Math.min(7, barW * 0.35));
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    }
  });
})();
