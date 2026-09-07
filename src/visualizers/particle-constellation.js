(() => {
  'use strict';

  JuqBawx.register({
    id: 'particle-constellation',
    name: 'Particle Constellation',
    categories: ['modern', 'ambient', 'interactive'],
    draw(fx, t) {
      const { ctx, width, height, runtime, audio, bass, energy, beat, frameMotionScale, palette, clearBackground, backdropGlow, particleSeed, TAU } = fx;
      clearBackground(0.35);
      backdropGlow(t, 1.2);
      const e = energy();
      const b = bass();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < particleSeed.length; i++) {
        const p = particleSeed[i];
        const v = audio[p.band] || 0;
        p.x += p.vx * (1 + e * 7) * frameMotionScale;
        p.y += p.vy * (1 + e * 7) * frameMotionScale;
        p.x += Math.cos(t * 0.00045 + p.phase) * v * 0.7 * frameMotionScale;
        p.y += Math.sin(t * 0.00037 + p.phase) * v * 0.7 * frameMotionScale;
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;
        const rr = p.r * (1 + v * 4 + b * 1.6 + beat * runtime.beatPulse * 0.8);
        ctx.fillStyle = palette(t, (i % 9) / 8, 0.18 + v * 0.75);
        ctx.shadowBlur = runtime.glow * 14;
        ctx.shadowColor = palette(t, (i % 9) / 8, 1);
        ctx.beginPath();
        ctx.arc(p.x, p.y, rr, 0, TAU);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.lineWidth = 0.65;
      for (let i = 0; i < particleSeed.length; i++) {
        const a = particleSeed[i];
        for (let j = i + 1; j < Math.min(particleSeed.length, i + 7); j++) {
          const b2 = particleSeed[j];
          const dx = a.x - b2.x;
          const dy = a.y - b2.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 125) {
            ctx.strokeStyle = palette(t, (i % 5) / 4, (1 - dist / 125) * (0.03 + e * 0.16));
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b2.x, b2.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
