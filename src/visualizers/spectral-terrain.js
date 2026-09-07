(() => {
  'use strict';

  const TERRAIN_ROWS = 34;
  const TERRAIN_COLUMNS = 40;
  const terrainGrid = new Float32Array(TERRAIN_ROWS * TERRAIN_COLUMNS * 2);

  JuqBawx.register({
    id: 'spectral-terrain',
    name: 'Spectral Terrain',
    categories: ['procedural', 'interactive'],
    tuning: { sensitivity: 0.92, glow: 0.82, trail: 0.72, beat: 0.78 },
    draw(fx, t) {
      const { ctx, width, height, runtime, audio, bass, highs, energy, beat, pointer, palette, rgba, clearBackground, baseBgColor, clamp, lerp, TAU } = fx;
      clearBackground(0.36);
      const horizon = height * (0.28 + (runtime.interactionEnabled && pointer.active ? (pointer.y - 0.5) * 0.12 * runtime.interactionStrength : 0));
      const centerX = width * (0.5 + (runtime.interactionEnabled && pointer.active ? (pointer.x - 0.5) * 0.16 * runtime.interactionStrength : 0));
      const rows = TERRAIN_ROWS;
      const columns = TERRAIN_COLUMNS;
      const e = energy();
      const time = t * 0.00032;

      const sky = ctx.createLinearGradient(0, 0, 0, horizon * 1.5);
      sky.addColorStop(0, rgba(baseBgColor(), 1));
      sky.addColorStop(1, palette(t, 0.75, 0.14 + e * 0.08));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, horizon * 1.5);

      for (let row = 0; row < rows; row++) {
        const depth = row / (rows - 1);
        const perspective = Math.pow(depth, 1.75);
        const baseY = horizon + perspective * (height - horizon) * 1.08;
        const halfSpan = lerp(width * 0.04, width * 0.78, perspective);
        for (let column = 0; column < columns; column++) {
          const nx = column / (columns - 1) * 2 - 1;
          const band = Math.floor(clamp(Math.abs(nx) * 0.55 + depth * 0.45, 0, 1) * 116);
          const audioLift = (audio[band] || 0) * runtime.sensitivity * (0.25 + perspective * 0.75);
          const terrain = Math.sin(nx * 6.2 + depth * 7.5 - time * 4.2) * 0.42 +
            Math.sin(nx * 13.4 - depth * 4.8 + time * 2.1) * 0.2 +
            Math.cos(nx * 2.7 + depth * 15.2) * 0.18;
          const elevation = (terrain * (0.5 + e * 0.8) + audioLift * 1.7) * height * 0.105 * perspective;
          const offset = (row * columns + column) * 2;
          terrainGrid[offset] = centerX + nx * halfSpan;
          terrainGrid[offset + 1] = baseY - elevation;
        }
      }

      ctx.globalCompositeOperation = 'lighter';
      for (let row = 0; row < rows; row++) {
        const depth = row / (rows - 1);
        ctx.beginPath();
        for (let column = 0; column < columns; column++) {
          const offset = (row * columns + column) * 2;
          if (column) ctx.lineTo(terrainGrid[offset], terrainGrid[offset + 1]);
          else ctx.moveTo(terrainGrid[offset], terrainGrid[offset + 1]);
        }
        ctx.strokeStyle = palette(t, depth, 0.08 + depth * 0.54 + e * 0.12);
        ctx.shadowColor = palette(t, depth, 1);
        ctx.shadowBlur = runtime.glow * 8 * depth;
        ctx.lineWidth = 0.55 + depth * 1.25;
        ctx.stroke();
      }
      for (let column = 0; column < columns; column += 2) {
        ctx.beginPath();
        for (let row = 0; row < rows; row++) {
          const offset = (row * columns + column) * 2;
          if (row) ctx.lineTo(terrainGrid[offset], terrainGrid[offset + 1]);
          else ctx.moveTo(terrainGrid[offset], terrainGrid[offset + 1]);
        }
        ctx.strokeStyle = palette(t, column / columns, 0.08 + highs() * 0.18);
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';

      const sunRadius = Math.min(width, height) * (0.055 + bass() * 0.025 + beat * 0.008);
      const sun = ctx.createRadialGradient(centerX, horizon * 0.63, 0, centerX, horizon * 0.63, sunRadius * 2.4);
      sun.addColorStop(0, palette(t, 0.06, 0.8));
      sun.addColorStop(0.45, palette(t, 0.8, 0.2));
      sun.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(centerX, horizon * 0.63, sunRadius * 2.4, 0, TAU);
      ctx.fill();
    }
  });
})();
