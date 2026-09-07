(() => {
  'use strict';

  JuqBawx.register({
    id: 'winamp-classic-oscilloscope',
    name: 'Winamp Classic Oscilloscope',
    categories: ['winamp', 'retro'],
    tuning: { sensitivity: 0.88, glow: 0.72, trail: 0.76, beat: 0.92 },
    draw(fx, t) {
      const { ctx, width, height, runtime, audio, highs, rgba, clearBackground, pulse, clamp, lerp } = fx;
      clearBackground(0.48);
      ctx.fillStyle = '#071109';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(45,130,62,.14)';
      ctx.lineWidth = 1;
      const step = Math.max(32, Math.floor(width / 32));
      for (let x = 0; x < width; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
      for (let y = 0; y < height; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
      const scopePadding = clamp(Math.round(height * 0.045), 28, 56);
      const scopeBottom = height - scopePadding;
      const scopeTop = Math.max(54, height * 0.14);
      const amp = (scopeBottom - scopeTop) * pulse(0.08);
      ctx.strokeStyle = '#44ff62';
      ctx.shadowColor = '#44ff62';
      ctx.shadowBlur = 8 + runtime.glow * 14;
      ctx.lineWidth = Math.max(1.5, width / 900);
      ctx.beginPath();
      const pts = Math.min(900, Math.floor(width));
      for (let i = 0; i < pts; i++) {
        const x = i / (pts - 1) * width;
        const pos = i / (pts - 1) * 127;
        const v = lerp(audio[Math.floor(pos)] || 0, audio[Math.min(127, Math.ceil(pos))] || 0, pos % 1);
        const harmonic = Math.sin(i * 0.09 + t * 0.0015) * highs() * 0.1;
        const level = clamp(v * 1.4 + harmonic, 0, 1);
        const y = scopeBottom - level * amp;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(68,255,98,.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scopeBottom);
      ctx.lineTo(width, scopeBottom);
      ctx.stroke();
      ctx.fillStyle = 'rgba(120,255,145,.35)';
      ctx.font = '12px Consolas, monospace';
      ctx.fillText('OSCILLOSCOPE', 18, 28);
    }
  });
})();
