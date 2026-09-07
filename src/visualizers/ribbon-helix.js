(() => {
  'use strict';

  JuqBawx.register({
    id: 'ribbon-helix',
    name: 'Ribbon Helix',
    categories: ['modern', 'ambient', 'album'],
    draw(fx, t) {
      const { ctx, width, height, runtime, audio, mids, highs, beat, palette, clearBackground, backdropGlow } = fx;
      clearBackground(0.5);
      backdropGlow(t);
      ctx.globalCompositeOperation = 'lighter';
      const ribbons = 5;
      for (let r = 0; r < ribbons; r++) {
        ctx.beginPath();
        const amp = height * (0.08 + r * 0.015) * (1 + mids() * 2 + beat * runtime.beatPulse * 0.35);
        const yBase = height * (0.25 + r * 0.11);
        for (let x = 0; x <= width; x += 12) {
          const band = Math.floor((x / width) * 100);
          const v = audio[band] || 0;
          const y = yBase + Math.sin(x * 0.012 + t * 0.0012 + r) * amp + Math.cos(x * 0.004 - t * 0.0008 + r * 0.7) * amp * 0.45 + (v - 0.18) * amp * 1.8;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = palette(t, r / Math.max(1, ribbons - 1), 0.22 + (r + 1) / ribbons * 0.28 + highs() * 0.24);
        ctx.shadowColor = palette(t, r / Math.max(1, ribbons - 1), 1);
        ctx.shadowBlur = runtime.glow * 18;
        ctx.lineWidth = 1.6 + r * 0.4;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
