(() => {
  'use strict';

  JuqBawx.register({
    id: 'retro-vu-towers',
    name: 'Retro VU Towers',
    categories: ['winamp', 'retro'],
    draw(fx, t) {
      const { ctx, width, height, runtime, resample, rgba, clearBackground, clamp } = fx;
      clearBackground();
      const vals = resample(12);
      const margin = width * 0.08;
      const base = height * 0.82;
      const totalW = width - margin * 2;
      const colW = totalW / vals.length;
      ctx.fillStyle = '#0a0d0d';
      ctx.fillRect(margin - 18, height * 0.18, totalW + 36, height * 0.68);
      ctx.strokeStyle = 'rgba(180,210,190,.16)';
      ctx.strokeRect(margin - 18, height * 0.18, totalW + 36, height * 0.68);
      vals.forEach((v, i) => {
        const x = margin + i * colW;
        const h = height * 0.48;
        const needle = clamp(v, 0, 1.2);
        const g = ctx.createLinearGradient(0, base - h, 0, base);
        g.addColorStop(0, '#ff3425');
        g.addColorStop(0.3, '#ffcc22');
        g.addColorStop(1, '#39e95b');
        ctx.fillStyle = g;
        ctx.globalAlpha = 0.18;
        ctx.fillRect(x + colW * 0.18, base - h, colW * 0.64, h);
        ctx.globalAlpha = 1;
        const y = base - h * needle;
        ctx.fillStyle = needle > 0.84 ? '#ff3e2d' : needle > 0.6 ? '#ffd228' : '#5cff6e';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 6 + runtime.glow * 12;
        ctx.fillRect(x + colW * 0.12, y, colW * 0.76, 4);
        ctx.fillStyle = 'rgba(220,235,225,.4)';
        ctx.font = '10px Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(String(i + 1).padStart(2, '0'), x + colW * 0.5, base + 25);
      });
      ctx.textAlign = 'start';
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(200,235,212,.48)';
      ctx.font = '12px Consolas, monospace';
      ctx.fillText('12-BAND LEVEL MONITOR', margin - 4, height * 0.23);
    }
  });
})();
