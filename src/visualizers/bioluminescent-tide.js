(() => {
  'use strict';

  JuqBawx.register({
    id: 'bioluminescent-tide',
    name: 'Bioluminescent Tide',
    categories: ['ambient', 'album'],
    tuning: { sensitivity: 1.08, glow: 0.82, trail: 1.22, beat: 0.72 },
    draw(fx, t) {
      const { ctx, width, height, runtime, audio, bass, energy, beat, pointer, palette, rgba, clearBackground, baseBgColor, particleSeed, clamp, TAU } = fx;
      clearBackground(0.48);
      const calm = clamp(runtime.ambientMotion, 0, 1);
      const e = energy();
      const reaction = clamp((e * 0.9 + bass() * 1.25) * runtime.sensitivity + beat * runtime.beatPulse * 0.18, 0, 1.25);
      const horizon = height * 0.46;
      const ocean = ctx.createLinearGradient(0, horizon, 0, height);
      ocean.addColorStop(0, palette(t, 0.1, 0.04 + calm * 0.04 + reaction * 0.055));
      ocean.addColorStop(1, rgba(baseBgColor(), 0.92));
      ctx.fillStyle = ocean;
      ctx.fillRect(0, horizon, width, height - horizon);

      const horizonGlow = ctx.createRadialGradient(width * 0.5, horizon, 0, width * 0.5, horizon, Math.max(width, height) * 0.48);
      horizonGlow.addColorStop(0, palette(t, 0.18, 0.035 + reaction * 0.12));
      horizonGlow.addColorStop(0.42, palette(t, 0.72, reaction * 0.035));
      horizonGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = horizonGlow;
      ctx.fillRect(0, horizon - height * 0.2, width, height * 0.55);

      ctx.globalCompositeOperation = 'lighter';
      for (let layer = 0; layer < 6; layer++) {
        const baseY = height * (0.43 + layer * 0.085);
        const phase = t * (0.000055 + layer * 0.000008) * (0.25 + calm);
        const amplitude = height * (0.009 + layer * 0.0045 + reaction * (0.02 + layer * 0.0025));
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, baseY);
        for (let x = 0; x <= width + 16; x += 16) {
          const band = Math.floor((x / width) * 100);
          const audioLift = (audio[band] || 0) * runtime.sensitivity * height * (0.045 + reaction * 0.025) * (0.62 + calm * 0.38);
          const y = baseY + Math.sin(x * 0.007 + phase + layer * 0.9) * amplitude +
            Math.sin(x * 0.0022 - phase * 0.72) * amplitude * 0.8 - audioLift;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        const wave = ctx.createLinearGradient(0, baseY - amplitude * 2, 0, height);
        wave.addColorStop(0, palette(t, layer / 5, 0.065 + calm * 0.04 + reaction * 0.11));
        wave.addColorStop(0.42, palette(t, (layer + 2) / 7, 0.025 + calm * 0.025 + reaction * 0.035));
        wave.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = wave;
        ctx.fill();
        ctx.beginPath();
        for (let x = 0; x <= width + 16; x += 16) {
          const band = Math.floor((x / width) * 100);
          const audioLift = (audio[band] || 0) * runtime.sensitivity * height * (0.045 + reaction * 0.025) * (0.62 + calm * 0.38);
          const y = baseY + Math.sin(x * 0.007 + phase + layer * 0.9) * amplitude +
            Math.sin(x * 0.0022 - phase * 0.72) * amplitude * 0.8 - audioLift;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = palette(t, (layer + 1) / 7, 0.06 + reaction * 0.18);
        ctx.lineWidth = 0.7 + reaction * 1.2;
        ctx.stroke();
      }

      for (let index = 0; index < Math.min(90, particleSeed.length); index++) {
        const seed = particleSeed[index];
        const drift = t * 0.000018 * (0.2 + calm) * (0.6 + seed.r * 0.2);
        const x = (seed.x + Math.sin(drift + seed.phase) * 32 + width) % width;
        const y = (seed.y + Math.cos(drift * 0.73 + seed.phase) * 18 + height) % height;
        const audioValue = audio[seed.band] || 0;
        const alpha = clamp(0.045 + calm * 0.07 + audioValue * runtime.sensitivity * 0.38 + reaction * 0.035, 0, 0.62);
        ctx.fillStyle = palette(t, (index % 9) / 8, alpha);
        ctx.beginPath();
        ctx.arc(x, y, 0.8 + seed.r * 0.5 + audioValue * runtime.sensitivity * 5.2 + beat * 1.2, 0, TAU);
        ctx.fill();
      }

      if (runtime.interactionEnabled && pointer.active) {
        const lanternRadius = Math.min(width, height) * (0.12 + runtime.interactionStrength * 0.06);
        const lantern = ctx.createRadialGradient(pointer.x * width, pointer.y * height, 0, pointer.x * width, pointer.y * height, lanternRadius);
        lantern.addColorStop(0, palette(t, 0.2, 0.1 + calm * 0.07));
        lantern.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = lantern;
        ctx.beginPath();
        ctx.arc(pointer.x * width, pointer.y * height, lanternRadius, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
