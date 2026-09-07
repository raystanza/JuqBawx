(() => {
  'use strict';

  JuqBawx.register({
    id: 'plasma-tunnel',
    name: 'Plasma Tunnel',
    label: 'Plasma Tunnel (Winamp-era)',
    categories: ['milkdrop', 'shader'],
    tuning: { sensitivity: 1.05, glow: 1.1, trail: 1.22, beat: 1.18 },
    draw(fx, t) {
      const { ctx, width, height, runtime, bass, energy, palette, clearBackground, pulse, TAU } = fx;
      clearBackground(0.22);
      const cx = width * 0.5;
      const cy = height * 0.5;
      const e = energy();
      const b = bass();
      ctx.globalCompositeOperation = 'lighter';
      for (let r = 0; r < 20; r++) {
        const phase = (r / 20 + (t * 0.000055 * (0.45 + e * 2.3))) % 1;
        const rad = Math.pow(phase, 1.7) * Math.hypot(width, height) * 0.55 + 8;
        const sides = 8 + (r % 5);
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
          const a = i / sides * TAU + t * 0.00022 * (r % 2 ? 1 : -1) + Math.sin(t * 0.0008 + r) * 0.13 * b;
          const wobble = 1 + Math.sin(a * 3 + t * 0.001 + r) * (0.05 + 0.12 * e) * pulse(0.2);
          const x = cx + Math.cos(a) * rad * wobble;
          const y = cy + Math.sin(a) * rad * wobble;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = palette(t, r / 20, (1 - phase) * (0.12 + 0.65 * e));
        ctx.lineWidth = 1 + 3 * (1 - phase) * b;
        ctx.shadowBlur = runtime.glow * 18;
        ctx.shadowColor = palette(t, r / 20, 1);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
