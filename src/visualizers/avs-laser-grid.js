(() => {
  'use strict';

  JuqBawx.register({
    id: 'avs-laser-grid',
    name: 'AVS Laser Grid',
    label: 'AVS Laser Grid (Winamp-era)',
    categories: ['winamp'],
    tuning: { sensitivity: 1.02, glow: 1.08, trail: 1.05, beat: 1.12 },
    draw(fx, t) {
      const { ctx, width, height, runtime, bass, mids, highs, energy, palette, clearBackground, pulse, TAU } = fx;
      clearBackground(0.36);
      const horizon = height * 0.55;
      const e = energy();
      const b = bass();
      for (let i = -12; i <= 12; i++) {
        const xBottom = width / 2 + i * width * 0.075;
        ctx.strokeStyle = palette(t, 0.7, 0.12 + 0.15 * e);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(width / 2, horizon);
        ctx.lineTo(xBottom, height);
        ctx.stroke();
      }
      for (let i = 0; i < 16; i++) {
        const p = (i / 16 + t * 0.00008 * (0.5 + e * 3)) % 1;
        const y = horizon + (height - horizon) * p * p;
        ctx.strokeStyle = palette(t, 0.7, 0.06 + 0.28 * (1 - p));
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = palette(t, 0.2, 1);
      ctx.shadowColor = palette(t, 0.2, 1);
      ctx.shadowBlur = 8 + runtime.glow * 20;
      ctx.lineWidth = 1.5 + 3 * b;
      ctx.beginPath();
      const points = 180;
      for (let i = 0; i < points; i++) {
        const p = i / (points - 1);
        const a = p * TAU;
        const x = width / 2 + Math.sin(a * 3 + t * 0.00095) * (width * 0.28) * (0.55 + mids()) * pulse(0.1);
        const y = height * 0.34 + Math.sin(a * 4 + t * 0.00131) * (height * 0.18) * (0.5 + highs() * 1.5);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
