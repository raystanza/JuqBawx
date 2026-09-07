(() => {
  'use strict';

  JuqBawx.register({
    id: 'crt-scope-deluxe',
    name: 'CRT Scope Deluxe',
    categories: ['winamp', 'retro'],
    draw(fx, t) {
      const { ctx, width, height, runtime, audio, highs, rgba, clearBackground, pulse, lerp } = fx;
      clearBackground(0.22);
      ctx.fillStyle = '#041108';
      ctx.fillRect(0, 0, width, height);
      const grid = Math.max(26, Math.floor(width / 34));
      ctx.strokeStyle = 'rgba(60,150,80,.14)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
      for (let y = 0; y < height; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
      const cy = height * 0.5;
      const amp = height * 0.34 * pulse(0.28);
      const pts = Math.min(1200, Math.floor(width * 1.2));
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(90,255,120,.18)';
      ctx.beginPath();
      for (let j = 0; j < 3; j++) {
        for (let i = 0; i < pts; i++) {
          const x = i / (pts - 1) * width;
          const pos = i / (pts - 1) * 127;
          const v = lerp(audio[Math.floor(pos)] || 0, audio[Math.min(127, Math.ceil(pos))] || 0, pos % 1);
          const y = cy - ((v - 0.18) * 2.3 + Math.sin(i * 0.06 + t * 0.0015 + j * 0.12) * highs() * 0.22) * amp + j * 1.4;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.strokeStyle = '#7bff8d';
      ctx.shadowColor = '#7bff8d';
      ctx.shadowBlur = 12 + runtime.glow * 22;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < pts; i++) {
        const x = i / (pts - 1) * width;
        const pos = i / (pts - 1) * 127;
        const v = lerp(audio[Math.floor(pos)] || 0, audio[Math.min(127, Math.ceil(pos))] || 0, pos % 1);
        const y = cy - ((v - 0.18) * 2.5 + Math.sin(i * 0.06 + t * 0.0015) * highs() * 0.24) * amp;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(125,255,145,.3)';
      ctx.font = '12px Consolas, monospace';
      ctx.fillText('CRT SCOPE DELUXE', 18, 28);
    }
  });
})();
