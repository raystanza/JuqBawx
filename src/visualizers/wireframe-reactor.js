(() => {
  'use strict';

  JuqBawx.register({
    id: 'wireframe-reactor',
    name: 'Wireframe Reactor',
    categories: ['procedural'],
    draw(fx, t) {
      const { ctx, width, height, runtime, mids, highs, palette, clearBackground, backdropGlow, pulse, TAU } = fx;
      clearBackground(0.16);
      backdropGlow(t, 1.3);
      const cx = width / 2;
      const cy = height / 2;
      const layers = 10;
      const spin = t * 0.00022 * pulse(0.1);
      ctx.globalCompositeOperation = 'lighter';
      for (let l = 0; l < layers; l++) {
        const p = l / (layers - 1);
        const radius = Math.min(width, height) * (0.08 + p * 0.34) * (1 + mids() * 0.55);
        const sides = 5 + (l % 4);
        const zOffset = Math.sin(t * 0.0007 + l) * 18 * highs();
        const points = [];
        for (let i = 0; i < sides; i++) {
          const a = spin * (1 + p) + (i / sides) * TAU;
          points.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius * 0.72 + zOffset]);
        }
        ctx.strokeStyle = palette(t, p, 0.18 + 0.42 * (1 - p) + highs() * 0.2);
        ctx.shadowColor = palette(t, p, 1);
        ctx.shadowBlur = runtime.glow * 16;
        ctx.lineWidth = 1 + (1 - p) * 2;
        ctx.beginPath();
        points.forEach((pt, idx) => { if (idx === 0) ctx.moveTo(pt[0], pt[1]); else ctx.lineTo(pt[0], pt[1]); });
        ctx.closePath();
        ctx.stroke();
        if (l > 0) {
          const prevRadius = Math.min(width, height) * (0.08 + (p - 1 / (layers - 1)) * 0.34) * (1 + mids() * 0.55);
          const prevSides = 5 + ((l - 1) % 4);
          for (let i = 0; i < Math.min(sides, prevSides); i++) {
            const a1 = spin * (1 + p) + (i / sides) * TAU;
            const a2 = spin * (1 + (p - 1 / (layers - 1))) + (i / prevSides) * TAU;
            const x1 = cx + Math.cos(a1) * radius;
            const y1 = cy + Math.sin(a1) * radius * 0.72 + zOffset;
            const x2 = cx + Math.cos(a2) * prevRadius;
            const y2 = cy + Math.sin(a2) * prevRadius * 0.72 + Math.sin(t * 0.0007 + l - 1) * 18 * highs();
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
