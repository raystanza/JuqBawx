(() => {
  'use strict';

  JuqBawx.register({
    id: 'starlight-rings',
    name: 'Starlight Rings',
    categories: ['modern', 'ambient', 'procedural', 'album'],
    draw(fx, t) {
      const { ctx, width, height, runtime, bass, energy, beat, frameMotionScale, palette, clearBackground, stars, TAU } = fx;
      clearBackground(0.28);
      const cx = width / 2;
      const cy = height / 2;
      const e = energy();
      ctx.globalCompositeOperation = 'lighter';
      stars.forEach((s, i) => {
        s.radius -= s.speed * (1 + e * 4 + beat * runtime.beatPulse * 2.5) * frameMotionScale;
        if (s.radius < 10) {
          s.radius = Math.max(width, height) * 0.72;
          s.angle = Math.random() * TAU;
          s.z = Math.random();
        }
        const x = cx + Math.cos(s.angle) * s.radius;
        const y = cy + Math.sin(s.angle) * s.radius;
        const size = (1.2 + s.z * 2.4) * (1 + e * 1.6);
        ctx.fillStyle = palette(t, (i % 8) / 7, 0.12 + s.z * 0.65);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, TAU);
        ctx.fill();
      });
      for (let r = 0; r < 7; r++) {
        const rr = Math.min(width, height) * (0.08 + r * 0.07) * (1 + bass() * 0.7 + beat * runtime.beatPulse * 0.18);
        ctx.strokeStyle = palette(t, r / 6, 0.08 + (6 - r) * 0.07 + e * 0.08);
        ctx.lineWidth = 1 + (6 - r) * 0.35;
        ctx.shadowBlur = runtime.glow * 10;
        ctx.shadowColor = palette(t, r / 6, 1);
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, TAU);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
