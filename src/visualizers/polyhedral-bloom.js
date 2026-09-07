(() => {
  'use strict';

  const PHI = (1 + Math.sqrt(5)) / 2;
  const POLY_VERTICES = [
    [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
    [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
    [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]
  ];
  const POLY_FACES = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ];

  JuqBawx.register({
    id: 'polyhedral-bloom',
    name: 'Polyhedral Bloom',
    categories: ['procedural', 'interactive'],
    tuning: { sensitivity: 0.98, glow: 1.02, trail: 0.94, beat: 1.02 },
    draw(fx, t) {
      const { ctx, width, height, runtime, audio, bass, highs, beat, pointer, palette, rgba, clearBackground, backdropGlow, pulse, clamp, TAU } = fx;
      clearBackground(0.2);
      backdropGlow(t, 1.35);
      const cx = width / 2;
      const cy = height / 2;
      const pointerYaw = runtime.interactionEnabled && pointer.active ? (pointer.x - 0.5) * 1.3 * runtime.interactionStrength : 0;
      const pointerPitch = runtime.interactionEnabled && pointer.active ? (pointer.y - 0.5) * 0.9 * runtime.interactionStrength : 0;
      const yaw = t * 0.00019 + pointerYaw;
      const pitch = 0.42 + Math.sin(t * 0.00013) * 0.22 + pointerPitch;
      const roll = t * -0.00011;
      const baseScale = Math.min(width, height) * 0.22 * pulse(0.12);

      function projectVertex(vertex, vertexIndex, shellScale) {
        const length = Math.hypot(vertex[0], vertex[1], vertex[2]);
        const audioValue = audio[(vertexIndex * 9 + Math.round(shellScale * 17)) % 112] || 0;
        const bloom = (1 + audioValue * runtime.sensitivity * 0.32 + beat * 0.05) / length;
        let x = vertex[0] * bloom;
        let y = vertex[1] * bloom;
        let z = vertex[2] * bloom;
        const cosy = Math.cos(yaw * shellScale), siny = Math.sin(yaw * shellScale);
        [x, z] = [x * cosy + z * siny, -x * siny + z * cosy];
        const cosx = Math.cos(pitch), sinx = Math.sin(pitch);
        [y, z] = [y * cosx - z * sinx, y * sinx + z * cosx];
        const cosz = Math.cos(roll), sinz = Math.sin(roll);
        [x, y] = [x * cosz - y * sinz, x * sinz + y * cosz];
        const perspective = 3.4 / (3.4 - z);
        return { x: cx + x * baseScale * shellScale * perspective, y: cy + y * baseScale * shellScale * perspective, z, perspective };
      }

      ctx.globalCompositeOperation = 'lighter';
      [1.34, 0.92, 0.52].forEach((shellScale, shellIndex) => {
        const vertices = POLY_VERTICES.map((vertex, index) => projectVertex(vertex, index, shellScale));
        const faces = POLY_FACES.map((face, faceIndex) => ({
          face,
          faceIndex,
          depth: (vertices[face[0]].z + vertices[face[1]].z + vertices[face[2]].z) / 3
        })).sort((a, b) => a.depth - b.depth);
        faces.forEach(({ face, faceIndex, depth }) => {
          const light = clamp((depth + 1.4) / 2.8, 0, 1);
          ctx.beginPath();
          face.forEach((vertexIndex, index) => {
            const point = vertices[vertexIndex];
            index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y);
          });
          ctx.closePath();
          ctx.fillStyle = palette(t, (faceIndex / POLY_FACES.length + shellIndex * 0.24) % 1, (0.018 + light * 0.07 + beat * 0.025) * (1.1 - shellIndex * 0.2));
          ctx.strokeStyle = palette(t, (faceIndex / POLY_FACES.length + 0.36) % 1, 0.12 + light * 0.42 + highs() * 0.16);
          ctx.lineWidth = 0.65 + light * 1.15 + (2 - shellIndex) * 0.2;
          ctx.shadowColor = palette(t, faceIndex / POLY_FACES.length, 1);
          ctx.shadowBlur = runtime.glow * 9 * light;
          ctx.fill();
          ctx.stroke();
        });
      });
      ctx.shadowBlur = 0;
      const coreRadius = Math.min(width, height) * (0.025 + bass() * 0.045 + beat * 0.014);
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 4);
      core.addColorStop(0, palette(t, 0.1, 0.92));
      core.addColorStop(0.25, palette(t, 0.74, 0.3));
      core.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 4, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
