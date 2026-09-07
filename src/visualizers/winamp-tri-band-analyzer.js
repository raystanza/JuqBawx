(() => {
  'use strict';

  JuqBawx.register({
    id: 'winamp-tri-band-analyzer',
    name: 'Winamp Tri-Band Analyzer',
    categories: ['winamp', 'retro'],
    draw(fx, t) {
      const { ctx, width, height, runtime, audio, avg, rgba, clearBackground, clamp } = fx;
      clearBackground();
      const bands = [avg(audio, 0, 16), avg(audio, 16, 56), avg(audio, 56, 118)];
      const labels = ['BASS', 'MID', 'TREBLE'];
      const colors = ['#36ef4d', '#f1dc31', '#ef4434'];
      const margin = width * 0.12;
      const gap = width * 0.045;
      const meterW = (width - margin * 2 - gap * 2) / 3;
      const base = height * 0.76;
      const maxH = height * 0.48;
      ctx.font = `${Math.max(12, width / 100)}px Consolas, monospace`;
      bands.forEach((raw, i) => {
        const v = clamp(raw * runtime.sensitivity * (i === 0 ? runtime.bassBoost : 1), 0, 1.2);
        const x = margin + i * (meterW + gap);
        ctx.fillStyle = '#07100a';
        ctx.fillRect(x, height * 0.2, meterW, height * 0.62);
        ctx.strokeStyle = 'rgba(110,150,120,.28)';
        ctx.strokeRect(x, height * 0.2, meterW, height * 0.62);
        const segments = 24;
        for (let s = 0; s < segments; s++) {
          const on = s / segments < v;
          const y = base - s * (maxH / segments);
          ctx.fillStyle = on ? colors[i] : 'rgba(80,110,90,.08)';
          ctx.globalAlpha = on ? 0.9 : 1;
          ctx.fillRect(x + meterW * 0.18, y, meterW * 0.64, Math.max(3, maxH / segments - 2));
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(190,220,198,.55)';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x + meterW / 2, height * 0.78 + 34);
      });
      ctx.textAlign = 'start';
      ctx.fillStyle = 'rgba(160,200,172,.34)';
      ctx.fillText('WINAMP TRI-BAND', margin, height * 0.16);
    }
  });
})();
