(() => {
  'use strict';

  const GPU_FRAGMENT_COMMON = JuqBawx.gpuCommon;

  const GALACTIC_FRAGMENT_SHADER = `
    precision highp float;
    ${GPU_FRAGMENT_COMMON}

    void main() {
      vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
      float aspect = u_resolution.x / max(1.0, u_resolution.y);
      vec2 point = (uv - 0.5) * vec2(2.0 * aspect, 2.0);
      float radius = length(point);
      float angle = atan(point.y, point.x) + u_time * 0.12;
      float anglePosition = fract(angle / GPU_TAU + 0.5);
      float band = sampleBand(anglePosition);
      float rayCell = fract(anglePosition * 48.0);
      float rayDistance = abs(rayCell - 0.5) * 2.0;
      float ray = 1.0 - smoothstep(0.035, 0.19, rayDistance);
      float inner = 0.24;
      float outer = inner + (0.05 + band * 1.55) * (1.0 + u_audio.w * u_params.y * 0.12);
      float radialMask = smoothstep(inner - 0.018, inner + 0.012, radius) * (1.0 - smoothstep(outer - 0.03, outer + 0.025, radius));

      vec3 color = u_background * (0.42 + radius * 0.16);
      vec3 rayColor = sampleScenePalette(anglePosition + u_time * 0.006);
      color += rayColor * ray * radialMask * (0.26 + band * 1.35);

      float core = exp(-radius * radius * (7.5 - u_audio.x * 1.5));
      color += mix(sampleScenePalette(0.08), sampleScenePalette(0.58), radius * 1.8) * core * (0.18 + u_audio.x * 0.32);

      vec2 starGridSize = vec2(96.0, 54.0);
      vec2 starGrid = floor(uv * starGridSize);
      vec2 starUv = fract(uv * starGridSize) - 0.5;
      float starSeed = hash21(starGrid + 31.0);
      float starPresent = step(0.965, starSeed);
      float starSize = mix(0.06, 0.19, hash11(starSeed * 91.0));
      float star = (1.0 - smoothstep(starSize, starSize + 0.08, length(starUv))) * starPresent;
      float twinkle = 0.45 + 0.55 * sin(u_time * (0.7 + starSeed * 1.4) + starSeed * 23.0);
      color += sampleScenePalette(starSeed) * star * twinkle * 0.72;
      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `;

  JuqBawx.register({
    id: 'galactic-equalizer',
    name: 'Galactic Equalizer',
    categories: ['modern', 'ambient', 'procedural'],
    draw(fx, t) {
      const { ctx, width, height, runtime, bass, energy, beat, resample, palette, rgba, clearBackground, backdropGlow, pulse, renderGpuScene, compositeGpuScene, stars, TAU } = fx;
      if (renderGpuScene('galactic-equalizer', GALACTIC_FRAGMENT_SHADER, t, [
        0, runtime.beatPulse, 0, 0
      ])) {
        compositeGpuScene();
        return;
      }
      clearBackground(0.2);
      backdropGlow(t, 1.25);
      const cx = width / 2;
      const cy = height / 2;
      const vals = resample(48);
      const shortSide = Math.min(width, height);
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowBlur = 0;
      for (let i = 0; i < vals.length; i++) {
        const p = i / vals.length;
        const a = p * TAU + t * 0.00012;
        const v = vals[i];
        const inner = shortSide * 0.12;
        const outer = inner + v * shortSide * 0.36 * pulse(0.12);
        ctx.strokeStyle = palette(t, p, 0.14 + v * 0.7);
        ctx.lineWidth = 1.3 + v * 2.4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
        ctx.stroke();
      }

      const coreRadius = shortSide * (0.18 + bass() * 0.12 + beat * 0.025);
      const coreGlow = ctx.createRadialGradient(cx, cy, shortSide * 0.04, cx, cy, coreRadius);
      coreGlow.addColorStop(0, palette(t, 0.08, 0.22 + bass() * 0.18));
      coreGlow.addColorStop(0.48, palette(t, 0.58, 0.08 + energy() * 0.08));
      coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coreGlow;
      ctx.fillRect(cx - coreRadius, cy - coreRadius, coreRadius * 2, coreRadius * 2);

      const starCount = Math.min(stars.length, 220);
      const starColors = Array.from({ length: 12 }, (_, index) => palette(t, index / 12, 1));
      for (let i = 0; i < starCount; i++) {
        const s = stars[i];
        const r = s.radius * 0.7;
        const x = cx + Math.cos(s.angle + t * 0.00003) * r;
        const y = cy + Math.sin(s.angle + t * 0.00003) * r;
        ctx.globalAlpha = 0.15 + s.z * 0.45;
        ctx.fillStyle = starColors[i % starColors.length];
        const size = 1 + s.z * 2.4;
        ctx.fillRect(x - size * 0.5, y - size * 0.5, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
