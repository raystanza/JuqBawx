(() => {
  'use strict';

  JuqBawx.register({
    id: 'mirrored-horizon',
    name: 'Mirrored Horizon',
    categories: ['modern'],
    draw(fx, t) {
      const { ctx, width, height, runtime, resample, palette, rgba, clearBackground, pulse } = fx;
      clearBackground(0.7);
      const vals = resample(Math.min(runtime.barCount, 84));
      const cy = height * 0.5;
      const span = height * 0.41 * pulse(0.14);
      const barW = width / vals.length;
      ctx.shadowBlur = 8 + runtime.glow * 24;
      vals.forEach((v, i) => {
        const h = Math.max(1.5, v * span);
        ctx.fillStyle = palette(t, i / vals.length, 0.32 + v * 0.62);
        ctx.shadowColor = palette(t, i / vals.length, 1);
        ctx.fillRect(i * barW + 1, cy - h, Math.max(1, barW - 2), h * 2);
      });
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy + 0.5);
      ctx.lineTo(width, cy + 0.5);
      ctx.stroke();
    }
  });
})();
