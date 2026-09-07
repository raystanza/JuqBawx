(() => {
  'use strict';

  JuqBawx.register({
    id: 'analog-needle-deck',
    name: 'Analog Needle Deck',
    categories: ['retro'],
    draw(fx, t) {
      const { ctx, width, height, resample, rgba, clearBackground, clamp, TAU } = fx;
      clearBackground();
      const vals = resample(6);
      const pad = Math.min(width, height) * 0.08;
      const meterW = (width - pad * 2) / vals.length;
      const meterH = Math.min(height * 0.42, meterW * 0.8);
      const cy = height * 0.68;
      ctx.font = `${Math.max(12, Math.floor(width / 120))}px Consolas, monospace`;
      for (let i = 0; i < vals.length; i++) {
        const x = pad + i * meterW + meterW * 0.5;
        const radius = Math.min(meterW * 0.36, meterH * 0.5);
        ctx.fillStyle = 'rgba(250,245,225,.92)';
        ctx.beginPath();
        ctx.arc(x, cy, radius, Math.PI, TAU, false);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(30,30,30,.55)';
        ctx.lineWidth = 2;
        ctx.stroke();
        for (let tck = 0; tck <= 10; tck++) {
          const a = Math.PI + (tck / 10) * Math.PI;
          const x0 = x + Math.cos(a) * (radius * 0.78);
          const y0 = cy + Math.sin(a) * (radius * 0.78);
          const x1 = x + Math.cos(a) * (radius * 0.96);
          const y1 = cy + Math.sin(a) * (radius * 0.96);
          ctx.strokeStyle = 'rgba(40,40,40,.8)';
          ctx.lineWidth = tck % 5 === 0 ? 2 : 1;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
        const v = clamp(vals[i], 0, 1.1);
        const a = Math.PI + v * Math.PI;
        ctx.strokeStyle = '#e53c31';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, cy);
        ctx.lineTo(x + Math.cos(a) * radius * 0.86, cy + Math.sin(a) * radius * 0.86);
        ctx.stroke();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(x, cy, 4, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,245,228,.88)';
        ctx.fillRect(x - radius, cy, radius * 2, radius * 0.36);
        ctx.fillStyle = 'rgba(40,40,40,.75)';
        ctx.textAlign = 'center';
        ctx.fillText(`BAND ${i + 1}`, x, cy + radius * 0.24);
      }
      ctx.textAlign = 'start';
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.fillText('ANALOG NEEDLE DECK', pad, height * 0.18);
    }
  });
})();
