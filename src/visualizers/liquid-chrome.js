(() => {
  'use strict';

  let FX = null;

  const CHROME_FRAGMENT_SHADER = `
    precision highp float;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec3 u_audio;
    uniform vec4 u_pointer;
    uniform vec3 u_colors[5];

    varying vec2 v_uv;

    vec3 samplePalette(float position) {
      float scaled = fract(position) * 4.0;
      if (scaled < 1.0) return mix(u_colors[0], u_colors[1], scaled);
      if (scaled < 2.0) return mix(u_colors[1], u_colors[2], scaled - 1.0);
      if (scaled < 3.0) return mix(u_colors[2], u_colors[3], scaled - 2.0);
      return mix(u_colors[3], u_colors[4], scaled - 3.0);
    }

    void main() {
      float aspect = u_resolution.x / max(1.0, u_resolution.y);
      vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
      vec2 point = (uv - 0.5) * vec2(2.0 * aspect, 2.0);
      if (u_pointer.z > 0.0) {
        vec2 pointerPoint = vec2((u_pointer.x - 0.5) * 2.0 * aspect, (u_pointer.y - 0.5) * 2.0);
        vec2 pointerDelta = point - pointerPoint;
        float falloff = exp(-dot(pointerDelta, pointerDelta) * 2.8) * u_pointer.z;
        if (u_pointer.w > 1.5) {
          point += vec2(pointerDelta.y, -pointerDelta.x) * falloff * 0.16;
        } else {
          float direction = u_pointer.w > 0.5 ? 1.0 : -1.0;
          point += pointerDelta * falloff * 0.18 * direction;
        }
      }

      float radial = length(point);
      float warpX = point.x + sin(point.y * 3.1 - u_time * 2.3) * (0.16 + u_audio.x * 0.18);
      float warpY = point.y + cos(point.x * 2.7 + u_time * 1.7) * (0.14 + u_audio.y * 0.15);
      float cellular = sin(warpX * 4.2 + sin(warpY * 3.4 + u_time))
        + cos(warpY * 4.8 - cos(warpX * 2.2 - u_time * 1.4));
      float ripples = sin(radial * (10.0 + u_audio.x * 8.0) - u_time * 5.2 + cellular * 0.8);
      float field = cellular * 0.42 + ripples * 0.58;
      float ridgeBase = 1.0 - abs(sin(field * 2.2));
      float ridge2 = ridgeBase * ridgeBase;
      float ridge = ridge2 * ridge2 * ridge2 * ridgeBase;
      float sheenBase = clamp(1.0 - abs(field * 0.72 + point.y * 0.14), 0.0, 1.0);
      float sheen2 = sheenBase * sheenBase;
      float sheen4 = sheen2 * sheen2;
      float sheen = sheen4 * sheen4 * sheen2;
      float tone = field * 0.12 + radial * 0.18 + u_time * 0.025;
      float light = clamp(0.12 + ridge * (0.62 + u_audio.z * 0.35) + sheen * 0.9 + u_audio.x * 0.08, 0.0, 1.35);
      float edgeFade = clamp(1.15 - radial * 0.28, 0.48, 1.0);
      vec3 color = samplePalette(tone) * light * edgeFade + sheen * vec3(0.412, 0.439, 0.490);
      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `;

  const shaderCanvas = document.createElement('canvas');
  const shaderCtx = shaderCanvas.getContext('2d', { alpha: false });
  let shaderImage = null;

  function ensureShaderBuffer() {
    const { width, height, runtime, clamp } = FX;
    const longSides = [144, 220, 320];
    const longSide = longSides[clamp(Math.round(runtime.shaderQuality), 0, longSides.length - 1)];
    const aspect = width / Math.max(1, height);
    const nextWidth = Math.max(80, Math.round(aspect >= 1 ? longSide : longSide * aspect));
    const nextHeight = Math.max(80, Math.round(aspect >= 1 ? longSide / aspect : longSide));
    if (shaderCanvas.width !== nextWidth || shaderCanvas.height !== nextHeight || !shaderImage) {
      shaderCanvas.width = nextWidth;
      shaderCanvas.height = nextHeight;
      shaderImage = shaderCtx.createImageData(nextWidth, nextHeight);
    }
    return shaderImage;
  }

  function renderLiquidChromeCpu(t, pointerAmount) {
    const { runtime, bass, mids, highs, pointer, cachedPaletteRgb, refreshPaletteCache, clamp, lerp } = FX;
    const image = ensureShaderBuffer();
    const sw = shaderCanvas.width;
    const sh = shaderCanvas.height;
    const data = image.data;
    refreshPaletteCache();
    const colors = cachedPaletteRgb;
    const time = t * 0.00024;
    const b = bass() * runtime.sensitivity;
    const m = mids() * runtime.sensitivity;
    const h = highs() * runtime.sensitivity;
    const pointerX = (pointer.x - 0.5) * 2 * (sw / sh);
    const pointerY = (pointer.y - 0.5) * 2;
    let offset = 0;

    for (let y = 0; y < sh; y++) {
      const vy = (y / Math.max(1, sh - 1) - 0.5) * 2;
      for (let x = 0; x < sw; x++) {
        let ux = (x / Math.max(1, sw - 1) - 0.5) * 2 * (sw / sh);
        let uy = vy;
        if (pointerAmount) {
          const pdx = ux - pointerX;
          const pdy = uy - pointerY;
          const falloff = Math.exp(-(pdx * pdx + pdy * pdy) * 2.8) * pointerAmount;
          const direction = runtime.interactionMode === 1 ? 1 : -1;
          if (runtime.interactionMode === 2) {
            ux += pdy * falloff * 0.16;
            uy -= pdx * falloff * 0.16;
          } else {
            ux += pdx * falloff * 0.18 * direction;
            uy += pdy * falloff * 0.18 * direction;
          }
        }

        const radial = Math.hypot(ux, uy);
        const warpX = ux + Math.sin(uy * 3.1 - time * 2.3) * (0.16 + b * 0.18);
        const warpY = uy + Math.cos(ux * 2.7 + time * 1.7) * (0.14 + m * 0.15);
        const cellular = Math.sin(warpX * 4.2 + Math.sin(warpY * 3.4 + time)) +
          Math.cos(warpY * 4.8 - Math.cos(warpX * 2.2 - time * 1.4));
        const ripples = Math.sin(radial * (10 + b * 8) - time * 5.2 + cellular * 0.8);
        const field = cellular * 0.42 + ripples * 0.58;
        const ridge = Math.pow(1 - Math.abs(Math.sin(field * 2.2)), 7);
        const sheen = Math.pow(clamp(1 - Math.abs(field * 0.72 + uy * 0.14), 0, 1), 10);
        const tone = ((field * 0.12 + radial * 0.18 + time * 0.025) % 1 + 1) % 1;
        const palettePosition = tone * (colors.length - 1);
        const colorIndex = Math.min(colors.length - 2, Math.floor(palettePosition));
        const colorMix = palettePosition - colorIndex;
        const c0 = colors[colorIndex];
        const c1 = colors[colorIndex + 1];
        const light = clamp(0.12 + ridge * (0.62 + h * 0.35) + sheen * 0.9 + b * 0.08, 0, 1.35);
        const edgeFade = clamp(1.15 - radial * 0.28, 0.48, 1);
        data[offset++] = clamp(lerp(c0.r, c1.r, colorMix) * light * edgeFade + sheen * 105, 0, 255);
        data[offset++] = clamp(lerp(c0.g, c1.g, colorMix) * light * edgeFade + sheen * 112, 0, 255);
        data[offset++] = clamp(lerp(c0.b, c1.b, colorMix) * light * edgeFade + sheen * 125, 0, 255);
        data[offset++] = 255;
      }
    }

    shaderCtx.putImageData(image, 0, 0);
  }

  function renderLiquidChromeGpu(t, pointerAmount) {
    const { runtime, pointer, bass, mids, highs, renderCustomGpuScene } = FX;
    return renderCustomGpuScene(
      'liquid-chrome',
      CHROME_FRAGMENT_SHADER,
      ['u_resolution', 'u_time', 'u_audio', 'u_pointer', 'u_colors[0]'],
      (gl, uniforms, surface, paletteColors) => {
        gl.uniform2f(uniforms.u_resolution, surface.width, surface.height);
        gl.uniform1f(uniforms.u_time, t * 0.00024);
        gl.uniform3f(uniforms.u_audio, bass() * runtime.sensitivity, mids() * runtime.sensitivity, highs() * runtime.sensitivity);
        gl.uniform4f(uniforms.u_pointer, pointer.x, pointer.y, pointerAmount, runtime.interactionMode);
        gl.uniform3fv(uniforms['u_colors[0]'], paletteColors);
      }
    );
  }

  JuqBawx.register({
    id: 'liquid-chrome',
    name: 'Liquid Chrome',
    categories: ['shader', 'interactive'],
    tuning: { sensitivity: 1.02, glow: 1.05, trail: 0.82, beat: 1.08 },
    invalidate() { shaderImage = null; },
    draw(fx, t) {
      FX = fx;
      const { ctx, width, height, runtime, beat, pointer, palette, rgba, clearBackground, gpuCanvas } = fx;
      const pointerAmount = runtime.interactionEnabled && pointer.active ? runtime.interactionStrength : 0;
      const source = renderLiquidChromeGpu(t, pointerAmount) ? gpuCanvas : shaderCanvas;
      if (source === shaderCanvas) renderLiquidChromeCpu(t, pointerAmount);
      clearBackground();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(source, 0, 0, width, height);
      ctx.globalCompositeOperation = 'screen';
      const chromeGlow = ctx.createRadialGradient(width * pointer.x, height * pointer.y, 0, width * pointer.x, height * pointer.y, Math.max(width, height) * 0.58);
      chromeGlow.addColorStop(0, palette(t, 0.2, (0.03 + beat * 0.06) * (1 + pointerAmount * 0.4)));
      chromeGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = chromeGlow;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
