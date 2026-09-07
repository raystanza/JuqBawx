(() => {
  'use strict';

  JuqBawx.register({
    id: 'cassette-deck',
    name: 'Cassette Deck',
    categories: ['winamp', 'retro'],
    draw(fx, t) {
      const { ctx, width, height, runtime, audio, energy, avg, rgba, clearBackground, roundedRect, clamp, TAU } = fx;
      clearBackground();
      const deckW = Math.min(width * 0.74, 980);
      const deckH = Math.min(height * 0.56, 520);
      const x = (width - deckW) / 2;
      const y = (height - deckH) / 2;
      ctx.fillStyle = '#17191c';
      roundedRect(x, y, deckW, deckH, 18);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.12)';
      ctx.lineWidth = 2;
      ctx.stroke();
      const windowX = x + deckW * 0.17;
      const windowY = y + deckH * 0.24;
      const windowW = deckW * 0.66;
      const windowH = deckH * 0.42;
      ctx.fillStyle = '#07090a';
      roundedRect(windowX, windowY, windowW, windowH, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(210,220,225,.16)';
      ctx.stroke();
      const reelR = Math.min(windowW, windowH) * 0.19;
      const leftX = windowX + windowW * 0.3;
      const rightX = windowX + windowW * 0.7;
      const reelY = windowY + windowH * 0.52;
      const spin = t * 0.002 * (0.3 + energy() * 2.5);
      [leftX, rightX].forEach((rx, ri) => {
        ctx.fillStyle = '#d6d9dc';
        ctx.beginPath();
        ctx.arc(rx, reelY, reelR, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#25292d';
        ctx.beginPath();
        ctx.arc(rx, reelY, reelR * 0.68, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#aeb4b8';
        ctx.lineWidth = reelR * 0.12;
        for (let s = 0; s < 6; s++) {
          const a = spin * (ri ? 1 : -1) + s / 6 * TAU;
          ctx.beginPath();
          ctx.moveTo(rx + Math.cos(a) * reelR * 0.18, reelY + Math.sin(a) * reelR * 0.18);
          ctx.lineTo(rx + Math.cos(a) * reelR * 0.58, reelY + Math.sin(a) * reelR * 0.58);
          ctx.stroke();
        }
      });
      const vu = [avg(audio,0,32), avg(audio,32,96)];
      vu.forEach((v, i) => {
        const bx = x + deckW * (0.17 + i * 0.36);
        const by = y + deckH * 0.78;
        const bw = deckW * 0.3;
        ctx.fillStyle = 'rgba(255,255,255,.05)';
        ctx.fillRect(bx, by, bw, 12);
        const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        g.addColorStop(0, '#45df5e'); g.addColorStop(.72, '#f2d43e'); g.addColorStop(1, '#ef4738');
        ctx.fillStyle = g;
        ctx.fillRect(bx, by, bw * clamp(v * runtime.sensitivity * 1.5, 0, 1), 12);
      });
      ctx.fillStyle = 'rgba(235,240,245,.55)';
      ctx.font = `${Math.max(12, deckW / 62)}px Consolas, monospace`;
      ctx.fillText('JUQBAWX // TYPE IV // AUDIO REACTIVE', x + deckW * 0.08, y + deckH * 0.13);
    }
  });
})();
