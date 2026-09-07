(() => {
  'use strict';

  JuqBawx.register({
    id: 'radial-bloom',
    name: 'Radial Bloom',
    categories: ['modern', 'ambient', 'procedural'],
    draw(fx, t) {
      const { ctx, width, height, runtime, resample, palette, clearBackground, backdropGlow, pulse, TAU } = fx;
      clearBackground(0.65);
      backdropGlow(t);
      const vals = resample(Math.min(runtime.barCount, 96));
      const cx = width / 2;
      const cy = height / 2;
      const minR = Math.min(width, height) * 0.11;
      const maxLen = Math.min(width, height) * 0.32 * pulse(0.2);
      ctx.lineCap = 'round';
      vals.forEach((v, i) => {
        const a = (i / vals.length) * TAU - Math.PI / 2;
        const r0 = minR * (1 + 0.08 * Math.sin(t * 0.001 + i * 0.31));
        const r1 = r0 + Math.max(2, v * maxLen);
        ctx.strokeStyle = palette(t, i / vals.length, 0.34 + v * 0.66);
        ctx.shadowColor = palette(t, i / vals.length, 1);
        ctx.shadowBlur = 6 + runtime.glow * 24 * v;
        ctx.lineWidth = Math.max(1, Math.min(width, height) / 450);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;
    }
  });
})();
