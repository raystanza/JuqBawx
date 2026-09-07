(() => {
  'use strict';

  JuqBawx.register({
    id: 'aurora-wave',
    name: 'Aurora Wave',
    categories: ['modern', 'ambient', 'album'],
    draw(fx, t) {
      const { ctx, width, height, runtime, audio, mids, energy, beat, palette, clearBackground, clamp } = fx;
      clearBackground(0.52);
      ctx.globalCompositeOperation = 'lighter';
      const bands = 5;
      for (let k = 0; k < bands; k++) {
        const yBase = height * (0.19 + k * 0.14);
        const amp = height * (0.03 + 0.024 * k) * (1 + energy() * 2.7 + beat * runtime.beatPulse * 0.7);
        const g = ctx.createLinearGradient(0, yBase - amp * 3, 0, yBase + amp * 3);
        g.addColorStop(0, palette(t, k / bands, 0));
        g.addColorStop(0.5, palette(t, k / bands, 0.18 + mids() * 0.14));
        g.addColorStop(1, palette(t, k / bands, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-20, yBase);
        for (let x = -20; x <= width + 20; x += 18) {
          const band = clamp(Math.floor((x / width) * 90), 0, 127);
          const v = audio[band] || 0;
          const y = yBase + Math.sin(x * 0.008 + t * 0.00045 + k * 1.3) * amp + Math.sin(x * 0.0026 - t * 0.00022) * amp * 0.8 + (v - 0.18) * amp * 2.3;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width + 20, yBase + amp * 5);
        ctx.lineTo(-20, yBase + amp * 5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
