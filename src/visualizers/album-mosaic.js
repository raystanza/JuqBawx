(() => {
  'use strict';

  JuqBawx.register({
    id: 'album-mosaic',
    name: 'Album Mosaic',
    categories: ['ambient', 'album', 'interactive'],
    tuning: { sensitivity: 0.88, glow: 0.78, trail: 0.88, beat: 0.72 },
    draw(fx, t) {
      const { ctx, width, height, runtime, beat, resample, pointer, paletteStops, colorFromStops, rgba, clearBackground, roundedRect, pulse, albumArtEl, albumArtReady } = fx;
      clearBackground();
      const columns = width > height ? 7 : 5;
      const rows = width > height ? 4 : 7;
      const gap = Math.max(5, Math.min(width, height) * 0.009);
      const tileW = (width - gap * (columns + 1)) / columns;
      const tileH = (height - gap * (rows + 1)) / rows;
      const vals = resample(columns * rows);
      const stops = paletteStops();
      ctx.fillStyle = rgba(colorFromStops(stops, 0.65), 0.08);
      ctx.fillRect(0, 0, width, height);

      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const index = row * columns + column;
          const v = vals[index] || 0;
          const x = gap + column * (tileW + gap);
          const y = gap + row * (tileH + gap);
          const lift = v * tileH * 0.08 * pulse(0.1);
          const parallaxX = runtime.interactionEnabled && pointer.active ? (pointer.x - 0.5) * (column - columns / 2) * runtime.interactionStrength * 1.6 : 0;
          const parallaxY = runtime.interactionEnabled && pointer.active ? (pointer.y - 0.5) * (row - rows / 2) * runtime.interactionStrength * 1.6 : 0;
          ctx.save();
          ctx.shadowColor = rgba(colorFromStops(stops, index / (columns * rows)), 0.55);
          ctx.shadowBlur = runtime.glow * (8 + v * 16);
          roundedRect(x + parallaxX, y - lift + parallaxY, tileW, tileH, Math.min(18, tileW * 0.08));
          ctx.clip();
          if (albumArtReady && albumArtEl.naturalWidth) {
            const zoom = 1.02 + v * 0.12 + beat * 0.035;
            const scale = Math.max(tileW / albumArtEl.naturalWidth, tileH / albumArtEl.naturalHeight) * zoom;
            const drawW = albumArtEl.naturalWidth * scale;
            const drawH = albumArtEl.naturalHeight * scale;
            const driftX = Math.sin(t * 0.00018 + index * 1.7) * (drawW - tileW) * 0.3;
            const driftY = Math.cos(t * 0.00014 + index) * (drawH - tileH) * 0.3;
            ctx.drawImage(albumArtEl, x + parallaxX + (tileW - drawW) / 2 + driftX, y - lift + parallaxY + (tileH - drawH) / 2 + driftY, drawW, drawH);
            ctx.globalCompositeOperation = index % 2 ? 'screen' : 'source-atop';
            ctx.fillStyle = rgba(colorFromStops(stops, index / (columns * rows - 1)), 0.1 + v * 0.12);
            ctx.fillRect(x + parallaxX, y - lift + parallaxY, tileW, tileH);
          } else {
            const tileGradient = ctx.createLinearGradient(x, y, x + tileW, y + tileH);
            tileGradient.addColorStop(0, rgba(colorFromStops(stops, index / (columns * rows)), 0.78));
            tileGradient.addColorStop(1, rgba(colorFromStops(stops, index / (columns * rows) + 0.24), 0.28));
            ctx.fillStyle = tileGradient;
            ctx.fillRect(x + parallaxX, y - lift + parallaxY, tileW, tileH);
            ctx.strokeStyle = 'rgba(255,255,255,.16)';
            ctx.lineWidth = 1;
            for (let line = -tileH; line < tileW + tileH; line += 18) {
              ctx.beginPath();
              ctx.moveTo(x + line, y + tileH);
              ctx.lineTo(x + line + tileH, y);
              ctx.stroke();
            }
          }
          ctx.restore();
        }
      }
    }
  });
})();
