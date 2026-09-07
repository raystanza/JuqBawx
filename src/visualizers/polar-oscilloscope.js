(() => {
  'use strict';

  JuqBawx.register({
    id: 'polar-oscilloscope',
    name: 'Polar Oscilloscope',
    categories: ['modern', 'ambient'],
    draw(fx, t) {
      const { ctx, width, height, runtime, audio, energy, beat, palette, clearBackground, backdropGlow, pulse, TAU } = fx;
      clearBackground(0.52);
      backdropGlow(t);
      const cx = width / 2;
      const cy = height / 2;
      const baseR = Math.min(width, height) * 0.19;
      const amp = Math.min(width, height) * 0.17 * pulse(0.22);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (let ring = 0; ring < 3; ring++) {
        ctx.beginPath();
        const pts = 256;
        for (let i = 0; i <= pts; i++) {
          const p = i / pts;
          const idx = Math.floor(p * 127);
          const v = audio[idx] || 0;
          const a = p * TAU + t * 0.00018 * (ring + 1);
          const r = baseR + ring * 22 + v * amp * (0.8 + ring * 0.16) + Math.sin(a * 5 + ring) * 5 * beat;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = palette(t, ring / 2, 0.35 + energy() * 0.55);
        ctx.shadowColor = palette(t, ring / 2, 1);
        ctx.shadowBlur = 10 + runtime.glow * 22;
        ctx.lineWidth = 1.8 + ring;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
