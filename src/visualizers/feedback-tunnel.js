(() => {
  'use strict';

  JuqBawx.register({
    id: 'feedback-tunnel',
    name: 'Feedback Tunnel',
    categories: ['milkdrop', 'shader'],
    tuning: { sensitivity: 1.04, glow: 1.18, trail: 1.45, beat: 1.22 },
    draw(fx, t) {
      const { ctx, width, height, runtime, bass, energy, beat, palette, clearBackground, TAU } = fx;
      clearBackground(0.08);
      const cx = width / 2;
      const cy = height / 2;
      const e = energy();
      ctx.globalCompositeOperation = 'lighter';
      const layers = 28;
      for (let i = 0; i < layers; i++) {
        const p = (i / layers + t * 0.00007 * (0.7 + e * 3)) % 1;
        const s = Math.pow(1 - p, 2.2);
        const w = width * (0.1 + s * 0.95);
        const h = height * (0.08 + s * 0.95);
        const rot = t * 0.00028 * (i % 2 ? 1 : -1) + i * 0.18 + beat * runtime.beatPulse * 0.08;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.strokeStyle = palette(t, i / layers, 0.12 + 0.48 * (1 - p));
        ctx.shadowColor = palette(t, i / layers, 1);
        ctx.shadowBlur = runtime.glow * 20 * (1 - p);
        ctx.lineWidth = 1 + 4 * (1 - p) * (0.6 + bass());
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        if (i % 4 === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, Math.min(w, h) * 0.18, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
