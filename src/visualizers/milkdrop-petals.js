(() => {
  'use strict';

  JuqBawx.register({
    id: 'milkdrop-petals',
    name: 'MilkDrop Petals',
    categories: ['milkdrop', 'shader'],
    tuning: { sensitivity: 1.08, glow: 1.22, trail: 1.42, beat: 1.3 },
    draw(fx, t) {
      const { ctx, width, height, runtime, bass, mids, highs, resample, palette, clearBackground, backdropGlow, pulse, TAU } = fx;
      clearBackground(0.1);
      backdropGlow(t, 1.6);
      const cx = width / 2;
      const cy = height / 2;
      const vals = resample(72);
      ctx.globalCompositeOperation = 'lighter';
      for (let layer = 0; layer < 8; layer++) {
        ctx.beginPath();
        const phase = t * 0.00025 * (1 + layer * 0.18);
        for (let i = 0; i <= vals.length; i++) {
          const p = (i % vals.length) / vals.length;
          const v = vals[i % vals.length];
          const a = p * TAU + phase + layer * 0.22;
          const radial = Math.min(width, height) * (0.12 + layer * 0.035 + v * 0.18 * pulse(0.15));
          const ripple = Math.sin(a * (4 + layer) + t * 0.0011) * (18 + 50 * bass());
          const x = cx + Math.cos(a) * (radial + ripple);
          const y = cy + Math.sin(a) * (radial - ripple * 0.35);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = palette(t, layer / 7, 0.035 + mids() * 0.05);
        ctx.strokeStyle = palette(t, layer / 7, 0.15 + highs() * 0.48);
        ctx.lineWidth = 1.2 + layer * 0.18;
        ctx.shadowBlur = runtime.glow * 18;
        ctx.shadowColor = palette(t, layer / 7, 1);
        ctx.fill();
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
