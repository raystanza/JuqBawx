(() => {
  'use strict';

  let FX = null;

  const GPU_FRAGMENT_COMMON = JuqBawx.gpuCommon;

  const KALEIDOSCOPE_FRAGMENT_SHADER = `
    precision highp float;
    ${GPU_FRAGMENT_COMMON}

    void main() {
      vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
      float aspect = u_resolution.x / max(1.0, u_resolution.y);
      vec2 point = (uv - 0.5) * vec2(2.0 * aspect, 2.0);
      float zoom = clamp(u_params.z, 0.6, 1.6);
      float radius = length(point) / zoom;
      float segments = clamp(u_params.x, 6.0, 16.0);
      float wedge = GPU_TAU / segments;
      float spin = u_time * 0.22 * u_params.w + u_audio.w * 0.018 * u_params.w;
      float angle = atan(point.y, point.x) + spin;
      float folded = abs(mod(angle + wedge, wedge * 2.0) - wedge) / wedge;
      float complexity = clamp(u_params.y, 0.2, 1.0);
      float band = sampleBand(fract(radius * 0.62 + folded * 0.38));

      float rings = 5.0 + complexity * 8.0;
      float cells = sin(radius * (18.0 + complexity * 25.0) - u_time * (0.7 + u_audio.x * 1.8));
      cells += cos(folded * (9.0 + complexity * 17.0) + radius * 9.0 + u_time * 0.45);
      cells += sin((folded + radius) * (13.0 + complexity * 10.0) - u_time * 0.31) * 0.65;
      float ridgeBase = 1.0 - abs(sin(cells * 1.3 + band * 2.1));
      float ridge = ridgeBase * ridgeBase * ridgeBase;

      float ringPosition = fract(radius * rings + folded * 0.58 + sin(folded * 7.0 - u_time * 0.3) * 0.08);
      float ringDistance = min(ringPosition, 1.0 - ringPosition);
      float ringSeam = 1.0 - smoothstep(0.018, 0.065, ringDistance);
      float foldDistance = min(folded, 1.0 - folded);
      float foldSeam = 1.0 - smoothstep(0.0, 0.035, foldDistance);
      float shard = 1.0 - smoothstep(0.025, 0.085, abs(fract((radius - folded * 0.31) * (8.0 + complexity * 9.0)) - 0.5));

      float tone = cells * 0.08 + radius * 0.24 + folded * 0.31 + u_time * 0.012;
      vec3 color = sampleScenePalette(tone) * (0.09 + ridge * (0.38 + band * 0.68));
      color += sampleScenePalette(tone + 0.32) * (ringSeam * 0.45 + foldSeam * 0.28 + shard * 0.14) * (0.45 + band * 0.6);
      float center = exp(-radius * radius * 42.0) * (0.45 + u_audio.x * 0.55);
      color += sampleScenePalette(0.06 + u_time * 0.01) * center;
      float edgeFade = 1.0 - smoothstep(0.72, 1.5, radius);
      color = mix(u_background * 0.38, color, clamp(edgeFade + 0.18, 0.0, 1.0));
      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `;

  const kaleidoCanvas = document.createElement('canvas');
  const kaleidoCtx = kaleidoCanvas.getContext('2d', { alpha: true, desynchronized: true });

  function kaleidoPoint(radius, angle) {
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  }

  function ensureKaleidoscopeBuffer() {
    const { width, height, runtime, clamp } = FX;
    const maxSides = [900, 1280, 1680];
    const maxSide = maxSides[clamp(Math.round(runtime.shaderQuality), 0, maxSides.length - 1)];
    const renderScale = Math.min(1, maxSide / Math.max(1, width, height));
    const nextWidth = Math.max(1, Math.round(width * renderScale));
    const nextHeight = Math.max(1, Math.round(height * renderScale));
    if (kaleidoCanvas.width !== nextWidth || kaleidoCanvas.height !== nextHeight) {
      kaleidoCanvas.width = nextWidth;
      kaleidoCanvas.height = nextHeight;
    }
    kaleidoCtx.setTransform(1, 0, 0, 1, 0, 0);
    kaleidoCtx.clearRect(0, 0, kaleidoCanvas.width, kaleidoCanvas.height);
    kaleidoCtx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    return renderScale;
  }

  function drawKaleidoFacet(targetCtx, points, t, mix, value, fillBoost = 1) {
    const { runtime, highs, beat, palette } = FX;
    targetCtx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) targetCtx.moveTo(point[0], point[1]);
      else targetCtx.lineTo(point[0], point[1]);
    });
    targetCtx.closePath();
    targetCtx.fillStyle = palette(t, mix, (0.045 + value * 0.16 + beat * 0.04) * fillBoost);
    targetCtx.strokeStyle = palette(t, (mix + 0.34) % 1, 0.15 + value * 0.34 + highs() * 0.12);
    targetCtx.lineWidth = 0.75 + runtime.glow * 0.65 + value * 0.7;
    targetCtx.fill();
    targetCtx.stroke();
  }

  function drawKaleidoscopeWedge(targetCtx, t, vals, wedge, radius, complexity) {
    const { runtime, bass, energy, beat, palette, clamp } = FX;
    const ringCount = 5 + Math.round(complexity * 7);
    let previousSplit = wedge * 0.5;

    for (let ring = 0; ring < ringCount; ring++) {
      const p0 = ring / ringCount;
      const p1 = (ring + 1) / ringCount;
      const r0 = radius * Math.pow(p0, 0.82);
      const r1 = radius * Math.pow(p1, 0.82);
      const value = vals[(ring * 7 + 3) % vals.length];
      const split = wedge * clamp(
        0.5 + Math.sin(t * 0.00034 + ring * 1.73) * (0.1 + value * 0.13),
        0.2,
        0.8
      );
      const left = [
        kaleidoPoint(r0, 0), kaleidoPoint(r1, 0),
        kaleidoPoint(r1, split), kaleidoPoint(r0, previousSplit)
      ];
      const right = [
        kaleidoPoint(r0, previousSplit), kaleidoPoint(r1, split),
        kaleidoPoint(r1, wedge), kaleidoPoint(r0, wedge)
      ];
      drawKaleidoFacet(targetCtx, left, t, (ring * 0.19 + value * 0.35) % 1, value, ring % 2 ? 0.85 : 1.1);
      drawKaleidoFacet(targetCtx, right, t, (0.68 + ring * 0.17 + value * 0.2) % 1, value, ring % 2 ? 1.1 : 0.85);

      const diagonal = ring % 2
        ? [kaleidoPoint(r0, previousSplit), kaleidoPoint(r1, 0), kaleidoPoint(r1, split)]
        : [kaleidoPoint(r0, previousSplit), kaleidoPoint(r1, split), kaleidoPoint(r1, wedge)];
      drawKaleidoFacet(targetCtx, diagonal, t, (0.22 + ring * 0.23) % 1, value * 0.8, 0.62);
      previousSplit = split;
    }

    const shardCount = 5 + Math.round(complexity * 12);
    for (let shard = 0; shard < shardCount; shard++) {
      const p = (shard + 0.55) / shardCount;
      const value = vals[(shard * 11 + 17) % vals.length];
      const centerRadius = radius * (0.08 + Math.pow(p, 0.9) * 0.84);
      const angleWave = 0.5 + Math.sin(shard * 2.41 - t * 0.00052 + value * 2.2) * 0.34;
      const centerAngle = wedge * clamp(angleWave, 0.1, 0.9);
      const radialSize = radius * (0.018 + value * 0.038 + beat * 0.012);
      const angleSize = wedge * (0.07 + value * 0.09);
      const points = [
        kaleidoPoint(centerRadius - radialSize * 1.2, centerAngle),
        kaleidoPoint(centerRadius, centerAngle - angleSize),
        kaleidoPoint(centerRadius + radialSize * 1.45, centerAngle - angleSize * 0.18),
        kaleidoPoint(centerRadius + radialSize * 0.5, centerAngle + angleSize),
        kaleidoPoint(centerRadius - radialSize * 0.65, centerAngle + angleSize * 0.55)
      ];
      drawKaleidoFacet(targetCtx, points, t, (shard * 0.137 + value * 0.4) % 1, value, 1.32);
    }

    targetCtx.strokeStyle = palette(t, 0.12, 0.16 + energy() * 0.24);
    targetCtx.lineWidth = 0.8 + runtime.glow;
    for (let ring = 1; ring <= 3; ring++) {
      const r = radius * (ring / 4) * (1 + bass() * 0.1);
      targetCtx.beginPath();
      targetCtx.arc(0, 0, r, 0, wedge);
      targetCtx.stroke();
    }
  }

  JuqBawx.register({
    id: 'kaleidoscope-bloom',
    name: 'Kaleidoscope Bloom',
    categories: ['milkdrop', 'procedural', 'interactive'],
    tuning: { sensitivity: 1.06, glow: 1.14, trail: 1.28, beat: 1.25 },
    draw(fx, t) {
      FX = fx;
      const { ctx, width, height, runtime, bass, beat, resample, palette, clearBackground, backdropGlow, pulse, renderGpuScene, compositeGpuScene, clamp, TAU } = fx;
      const segmentOptions = [6, 8, 10, 12, 16];
      const segments = segmentOptions[clamp(Math.round(runtime.kaleidoSymmetry), 0, segmentOptions.length - 1)];
      if (renderGpuScene('kaleidoscope-bloom', KALEIDOSCOPE_FRAGMENT_SHADER, t, [
        segments, runtime.kaleidoComplexity, runtime.kaleidoZoom, runtime.kaleidoRotation
      ])) {
        compositeGpuScene();
        return;
      }
      clearBackground(0.12);
      backdropGlow(t, 1.8);
      const vals = resample(56);
      const cx = width / 2;
      const cy = height / 2;
      const wedge = TAU / segments;
      const radius = Math.hypot(width, height) * 0.58;
      const motifRadius = radius * clamp(runtime.kaleidoZoom, 0.6, 1.6) * pulse(0.045);
      const spin = (t * 0.00022 + beat * runtime.beatPulse * 0.018) * runtime.kaleidoRotation;
      const complexity = clamp(runtime.kaleidoComplexity, 0.2, 1);

      const renderScale = ensureKaleidoscopeBuffer();
      kaleidoCtx.save();
      kaleidoCtx.globalCompositeOperation = 'source-over';
      kaleidoCtx.translate(cx, cy);
      kaleidoCtx.beginPath();
      kaleidoCtx.moveTo(0, 0);
      kaleidoCtx.lineTo(radius, 0);
      kaleidoCtx.arc(0, 0, radius, 0, wedge);
      kaleidoCtx.closePath();
      kaleidoCtx.clip();
      kaleidoCtx.shadowBlur = (2 + runtime.glow * 9) * renderScale;
      kaleidoCtx.shadowColor = palette(t, 0.38, 0.72);
      drawKaleidoscopeWedge(kaleidoCtx, t, vals, wedge, motifRadius, complexity);
      kaleidoCtx.restore();

      ctx.globalCompositeOperation = 'screen';
      ctx.shadowBlur = 0;
      ctx.imageSmoothingEnabled = true;
      for (let segment = 0; segment < segments; segment++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(spin + segment * wedge);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(radius, 0);
        ctx.arc(0, 0, radius, 0, wedge);
        ctx.closePath();
        ctx.clip();

        // Odd sectors draw the same wedge mirrored, so the seams line up.
        if (segment % 2) {
          ctx.rotate(wedge);
          ctx.scale(1, -1);
        }
        ctx.drawImage(kaleidoCanvas, -cx, -cy, width, height);
        ctx.restore();
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-spin * 0.72);
      const centerRadius = Math.min(width, height) * (0.035 + bass() * 0.035 + beat * 0.012);
      ctx.beginPath();
      for (let point = 0; point <= segments; point++) {
        const angle = point / segments * TAU;
        const r = centerRadius * (point % 2 ? 0.58 : 1);
        if (point === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fillStyle = palette(t, 0.05, 0.42 + bass() * 0.28);
      ctx.strokeStyle = palette(t, 0.72, 0.72);
      ctx.lineWidth = 1.2 + runtime.glow * 1.8;
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
