(() => {
  'use strict';

  JuqBawx.register({
    id: 'milkdrop-spiral-feedback',
    name: 'MilkDrop Spiral Feedback',
    categories: ['milkdrop', 'shader'],
    tuning: { sensitivity: 1.08, glow: 1.2, trail: 1.5, beat: 1.32 },
    draw(fx, t) {
      const { ctx, width, height, runtime, bass, mids, energy, resample, palette, clearBackground, backdropGlow, pulse, TAU } = fx;
      clearBackground(0.065);
      backdropGlow(t, 1.7);
      const cx = width / 2;
      const cy = height / 2;
      const vals = resample(80);
      ctx.globalCompositeOperation = 'lighter';
      for (let arm = 0; arm < 7; arm++) {
        ctx.beginPath();
        for (let i = 0; i < vals.length; i++) {
          const p = i / (vals.length - 1);
          const v = vals[i];
          const a = arm / 7 * TAU + p * TAU * (2.4 + mids() * 1.8) + t * 0.00045;
          const r = Math.min(width, height) * p * 0.44 * (1 + v * 0.75 * pulse(0.18));
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = palette(t, arm / 7, 0.22 + energy() * 0.5);
        ctx.shadowColor = palette(t, arm / 7, 1);
        ctx.shadowBlur = runtime.glow * 22;
        ctx.lineWidth = 1.4 + bass() * 3;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
