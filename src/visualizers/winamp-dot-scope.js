(() => {
  'use strict';

  JuqBawx.register({
    id: 'winamp-dot-scope',
    name: 'Winamp Dot Scope',
    categories: ['winamp', 'retro'],
    draw(fx, t) {
      const { ctx, width, height, runtime, highs, resample, rgba, clearBackground, pulse, clamp, TAU } = fx;
      clearBackground(0.46);
      ctx.fillStyle = '#061006';
      ctx.fillRect(0, 0, width, height);
      const cols = 96;
      const vals = resample(cols);
      const scopePadding = clamp(Math.round(height * 0.045), 28, 56);
      const scopeBottom = height - scopePadding;
      const scopeTop = Math.max(54, height * 0.14);
      const amp = (scopeBottom - scopeTop) * pulse(0.06);
      ctx.shadowColor = '#56ff67';
      ctx.shadowBlur = 6 + runtime.glow * 9;
      for (let i = 0; i < cols; i++) {
        const x = (i + 0.5) / cols * width;
        const v = vals[i];
        const shimmer = Math.sin(i * 0.36 + t * 0.002) * highs() * 0.08;
        const level = clamp(v * 1.5 + shimmer, 0, 1);
        const y = scopeBottom - level * amp;
        const r = Math.max(1.2, Math.min(4.5, width / 500));
        ctx.fillStyle = i % 7 === 0 ? '#e6f55d' : '#56ff67';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(80,160,90,.12)';
      ctx.beginPath();
      ctx.moveTo(0, scopeBottom);
      ctx.lineTo(width, scopeBottom);
      ctx.stroke();
      ctx.fillStyle = 'rgba(125,220,140,.35)';
      ctx.font = '12px Consolas, monospace';
      ctx.fillText('DOT SCOPE', 18, 28);
    }
  });
})();
