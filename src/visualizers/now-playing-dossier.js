(() => {
  'use strict';

  JuqBawx.register({
    id: 'now-playing-dossier',
    name: 'Now Playing Dossier',
    categories: ['ambient', 'album'],
    tuning: { sensitivity: 0.7, glow: 0.62, trail: 0.35, beat: 0.28 },
    fullscreenUi: true,
    draw(fx, t) {
      const { ctx, width, height, runtime, audio, energy, avg, rgba, baseBgColor, drawAlbumArtBackdrop, albumArtReady, albumPrimary, albumSecondary, TAU } = fx;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = baseBgColor();
      ctx.fillRect(0, 0, width, height);
      drawAlbumArtBackdrop();

      const primary = albumArtReady ? albumPrimary : runtime.accent;
      const secondary = albumArtReady ? albumSecondary : runtime.secondary;
      const drift = Math.sin(t * 0.000075);
      const breathe = 0.82 + Math.sin(t * 0.00011 + 1.4) * 0.18;
      const glowX = width * (0.19 + drift * 0.018);
      const glowY = height * (0.48 + Math.cos(t * 0.000061) * 0.025);
      const glowRadius = Math.max(width, height) * 0.56;
      const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowRadius);
      glow.addColorStop(0, rgba(primary, 0.105 * breathe));
      glow.addColorStop(0.34, rgba(secondary, 0.045 * breathe));
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      const lineY = height * 0.885;
      const lineStart = width * 0.055;
      const lineWidth = width * 0.89;
      const traceHeight = Math.min(46, height * 0.055);
      const trace = ctx.createLinearGradient(lineStart, 0, lineStart + lineWidth, 0);
      trace.addColorStop(0, rgba(primary, 0));
      trace.addColorStop(0.16, rgba(primary, 0.18));
      trace.addColorStop(0.64, rgba(secondary, 0.12));
      trace.addColorStop(1, rgba(secondary, 0));
      ctx.strokeStyle = trace;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let index = 0; index <= 72; index++) {
        const x = lineStart + (index / 72) * lineWidth;
        const band = Math.min(127, Math.floor((index / 72) * 127));
        const value = avg(audio, band - 1, band + 2) * runtime.sensitivity;
        const envelope = Math.sin((index / 72) * Math.PI);
        const y = lineY - value * traceHeight * envelope;
        index ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = rgba(primary, 0.3);
      ctx.beginPath();
      ctx.arc(lineStart + lineWidth * 0.16, lineY, 1.5 + energy() * 2, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });
})();
