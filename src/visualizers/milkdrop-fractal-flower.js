(() => {
  'use strict';

  JuqBawx.register({
    id: 'milkdrop-fractal-flower',
    name: 'MilkDrop Fractal Flower',
    categories: ['milkdrop', 'shader'],
    tuning: { sensitivity: 1.06, glow: 1.24, trail: 1.38, beat: 1.28 },
    draw(fx, t) {
      const { ctx, width, height, runtime, audio, bass, highs, palette, clearBackground, backdropGlow, pulse, TAU } = fx;
      clearBackground(0.09);
      backdropGlow(t, 1.8);
      const cx = width / 2;
      const cy = height / 2;
      const levels = 5;
      const branches = 10;
      ctx.globalCompositeOperation = 'lighter';
      for (let level = 0; level < levels; level++) {
        const radius = Math.min(width, height) * (0.08 + level * 0.065) * pulse(0.08);
        for (let b = 0; b < branches; b++) {
          const a = b / branches * TAU + t * 0.00018 * (level % 2 ? -1 : 1);
          const idx = Math.floor((b / branches) * 100 + level * 4) % 128;
          const v = audio[idx] || 0;
          const petal = radius * (0.45 + v * 1.8 + bass() * 0.3);
          const px = cx + Math.cos(a) * radius;
          const py = cy + Math.sin(a) * radius;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(a + Math.PI / 2);
          ctx.scale(1, 0.55 + highs() * 0.5);
          ctx.beginPath();
          ctx.ellipse(0, 0, petal * 0.42, petal, 0, 0, TAU);
          ctx.fillStyle = palette(t, (b + level) / (branches + levels), 0.03 + v * 0.07);
          ctx.strokeStyle = palette(t, (b + level) / (branches + levels), 0.18 + v * 0.52);
          ctx.lineWidth = 1.1 + level * 0.15;
          ctx.shadowBlur = runtime.glow * 16;
          ctx.shadowColor = palette(t, b / branches, 1);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
