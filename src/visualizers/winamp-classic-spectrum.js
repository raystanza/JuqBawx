(() => {
  'use strict';

  JuqBawx.register({
    id: 'winamp-classic-spectrum',
    name: 'Winamp Classic Spectrum',
    categories: ['winamp', 'retro'],
    tuning: { sensitivity: 0.92, glow: 0.72, trail: 0.8, beat: 0.9 },
    draw(fx, t) {
      const { ctx, width, height, runtime, previous, resample, rgba, clearBackground, clamp } = fx;
      clearBackground();
      const count = 32;
      const vals = resample(count);
      const margin = Math.max(28, width * 0.08);
      const bottom = height * 0.78;
      const totalW = width - margin * 2;
      const barW = totalW / count;
      const unit = Math.max(3, Math.floor(height / 95));
      ctx.font = `${Math.max(11, Math.floor(width / 110))}px Consolas, monospace`;
      ctx.fillStyle = 'rgba(135,160,145,.45)';
      ctx.fillText('SPECTRUM ANALYZER', margin, bottom + 42);
      vals.forEach((v, i) => {
        const steps = Math.floor(clamp(v, 0, 1.2) * Math.floor(height * 0.46 / unit));
        for (let s = 0; s < steps; s++) {
          const ratio = s / Math.max(1, Math.floor(height * 0.46 / unit));
          ctx.fillStyle = ratio > 0.82 ? '#ff3b21' : ratio > 0.62 ? '#ffd21a' : '#38ef4a';
          ctx.fillRect(margin + i * barW, bottom - s * unit, Math.max(2, barW - 3), Math.max(2, unit - 1));
        }
        const peak = Math.floor(clamp(previous[Math.floor(i * 128 / count)] * runtime.sensitivity, 0, 1) * Math.floor(height * 0.46 / unit));
        ctx.fillStyle = '#f4e96a';
        ctx.fillRect(margin + i * barW, bottom - peak * unit - 2, Math.max(2, barW - 3), 2);
      });
      ctx.strokeStyle = 'rgba(90,120,105,.22)';
      ctx.strokeRect(margin - 12, height * 0.26, totalW + 24, height * 0.55);
    }
  });
})();
