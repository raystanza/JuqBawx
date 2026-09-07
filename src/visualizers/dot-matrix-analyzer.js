(() => {
  'use strict';

  JuqBawx.register({
    id: 'dot-matrix-analyzer',
    name: 'Dot Matrix Analyzer',
    categories: ['winamp', 'retro'],
    draw(fx, t) {
      const { ctx, width, height, runtime, previous, resample, palette, rgba, clearBackground, pulse, clamp, TAU } = fx;
      clearBackground();
      const cols = 48;
      const vals = resample(cols);
      const marginX = width * 0.08;
      const marginY = height * 0.16;
      const gridW = width - marginX * 2;
      const gridH = height * 0.64;
      const cellW = gridW / cols;
      const rows = 22;
      const cellH = gridH / rows;
      ctx.fillStyle = 'rgba(255,255,255,.04)';
      ctx.fillRect(marginX - 16, marginY - 16, gridW + 32, gridH + 32);
      for (let c = 0; c < cols; c++) {
        const steps = Math.floor(clamp(vals[c], 0, 1.2) * rows * pulse(0.1));
        for (let r = 0; r < rows; r++) {
          const x = marginX + c * cellW + cellW * 0.17;
          const y = marginY + gridH - (r + 1) * cellH + cellH * 0.14;
          const on = r < steps;
          const alpha = on ? 0.2 + (r / rows) * 0.65 : 0.06;
          ctx.fillStyle = on ? palette(t, r / rows, alpha) : 'rgba(255,255,255,0.03)';
          ctx.beginPath();
          ctx.arc(x + cellW * 0.33, y + cellH * 0.33, Math.min(cellW, cellH) * 0.22, 0, TAU);
          ctx.fill();
        }
        const peak = Math.floor(clamp(previous[Math.floor(c * 128 / cols)] * runtime.sensitivity, 0, 1) * rows);
        const px = marginX + c * cellW + cellW * 0.17 + cellW * 0.33;
        const py = marginY + gridH - (peak + 1) * cellH + cellH * 0.47;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(px, py, Math.min(cellW, cellH) * 0.16, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = 'rgba(255,255,255,.08)';
      ctx.strokeRect(marginX - 16, marginY - 16, gridW + 32, gridH + 32);
      ctx.fillStyle = 'rgba(255,255,255,.28)';
      ctx.font = '12px Consolas, monospace';
      ctx.fillText('DOT MATRIX ANALYZER', marginX - 10, marginY - 24);
    }
  });
})();
