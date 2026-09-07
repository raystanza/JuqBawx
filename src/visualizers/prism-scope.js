(() => {
  'use strict';

  JuqBawx.register({
    id: 'prism-scope',
    name: 'Prism Scope',
    categories: ['modern'],
    draw(fx, t) {
      const { ctx, width, height, runtime, resample, palette, rgba, clearBackground, backdropGlow, pulse, lerp } = fx;
      clearBackground(0.46);
      backdropGlow(t);
      const vals = resample(Math.min(runtime.barCount, 80));
      const cx = width / 2;
      const cy = height * 0.58;
      const scale = Math.min(width, height) * 0.28;
      const vertices = [[cx, cy - scale], [cx - scale * 0.86, cy + scale * 0.5], [cx + scale * 0.86, cy + scale * 0.5]];
      ctx.strokeStyle = 'rgba(255,255,255,.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(vertices[0][0], vertices[0][1]);
      ctx.lineTo(vertices[1][0], vertices[1][1]);
      ctx.lineTo(vertices[2][0], vertices[2][1]);
      ctx.closePath();
      ctx.stroke();
      vals.forEach((v, i) => {
        const p = i / Math.max(1, vals.length - 1);
        const left = [lerp(vertices[0][0], vertices[1][0], p), lerp(vertices[0][1], vertices[1][1], p)];
        const right = [lerp(vertices[0][0], vertices[2][0], p), lerp(vertices[0][1], vertices[2][1], p)];
        const lift = v * scale * 0.75 * pulse(0.12);
        ctx.strokeStyle = palette(t, p, 0.26 + v * 0.74);
        ctx.shadowColor = palette(t, p, 1);
        ctx.shadowBlur = runtime.glow * 18;
        ctx.beginPath();
        ctx.moveTo(left[0], left[1]);
        ctx.lineTo(cx, cy - lift);
        ctx.lineTo(right[0], right[1]);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;
    }
  });
})();
