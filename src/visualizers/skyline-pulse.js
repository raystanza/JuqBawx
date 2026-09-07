(() => {
  'use strict';

  const GPU_FRAGMENT_COMMON = JuqBawx.gpuCommon;

  const SKYLINE_FRAGMENT_SHADER = `
    precision highp float;
    ${GPU_FRAGMENT_COMMON}

    void main() {
      vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
      float aspect = u_resolution.x / max(1.0, u_resolution.y);
      float buildingCount = 42.0;
      float buildingId = floor(uv.x * buildingCount);
      float buildingPosition = (buildingId + 0.5) / buildingCount;
      float localX = fract(uv.x * buildingCount);
      float band = sampleBand(buildingPosition);
      float variation = hash11(buildingId + 19.0);
      float buildingHeight = max(0.06, band * 0.52 * (1.0 + u_audio.w * u_params.y * 0.12) + variation * 0.055);
      float base = 0.84;
      float top = base - buildingHeight;
      float inBuilding = step(top, uv.y) * step(uv.y, base) * step(0.025, localX) * step(localX, 0.975);

      vec2 point = (uv - vec2(0.5, 0.55)) * vec2(aspect, 1.0);
      float backdrop = exp(-dot(point, point) * 2.1) * (0.12 + u_audio.x * 0.18);
      vec3 color = u_background * (0.58 + uv.y * 0.25);
      color += sampleScenePalette(0.72 + u_time * 0.008) * backdrop;

      vec3 buildingColor = sampleScenePalette(buildingPosition + u_time * 0.006);
      color = mix(color, buildingColor * (0.22 + band * 0.72), inBuilding);

      float relativeY = (base - uv.y) / max(buildingHeight, 0.001);
      vec2 windowCell = vec2(fract(localX * 4.0), fract(relativeY * 14.0));
      vec2 windowId = vec2(floor(localX * 4.0), floor(relativeY * 14.0));
      float windowShape = step(0.25, windowCell.x) * step(windowCell.x, 0.68) * step(0.28, windowCell.y) * step(windowCell.y, 0.70);
      float windowOn = step(0.58, hash21(vec2(buildingId * 3.1, 11.0) + windowId));
      color += vec3(1.0, 0.84, 0.42) * windowShape * windowOn * inBuilding * (0.25 + band * 0.55);

      float ground = step(base, uv.y);
      color = mix(color, u_background * 0.72 + vec3(0.035), ground);
      float groundLine = 1.0 - smoothstep(0.0, 0.006, abs(uv.y - base));
      color += sampleScenePalette(0.12) * groundLine * 0.16;
      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `;

  JuqBawx.register({
    id: 'skyline-pulse',
    name: 'Skyline Pulse',
    categories: ['modern'],
    draw(fx, t) {
      const { ctx, width, height, runtime, resample, palette, rgba, clearBackground, backdropGlow, pulse, renderGpuScene, compositeGpuScene } = fx;
      if (renderGpuScene('skyline-pulse', SKYLINE_FRAGMENT_SHADER, t, [
        0, runtime.beatPulse, 0, 0
      ])) {
        compositeGpuScene();
        return;
      }
      clearBackground(0.4);
      backdropGlow(t);
      const vals = resample(42);
      const w = width / vals.length;
      const base = height * 0.84;
      ctx.beginPath();
      vals.forEach((v, i) => {
        const x = i * w;
        const h = Math.max(height * 0.06, v * height * 0.52 * pulse(0.12));
        ctx.fillStyle = palette(t, i / vals.length, 0.18 + v * 0.5);
        ctx.fillRect(x, base - h, Math.max(1, w - 1), h);
        const windowsX = Math.max(1, Math.min(4, Math.floor((w - 6) / 9)));
        const floors = Math.max(2, Math.min(14, Math.floor((h - 10) / 14)));
        for (let fx = 0; fx < windowsX; fx++) {
          for (let fy = 0; fy < floors; fy++) {
            if ((fx + fy + i) % 3 !== 0) continue;
            ctx.rect(x + 3 + fx * 9, base - 8 - fy * 14, 3, 5);
          }
        }
      });
      ctx.fillStyle = 'rgba(255,240,175,.45)';
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.08)';
      ctx.fillRect(0, base, width, height - base);
    }
  });
})();
