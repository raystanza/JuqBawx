// The shared WebGL 1 renderer: one context, one fullscreen triangle, a lazily
// compiled program cache, and per-program failure isolation. A scene that cannot
// compile or link falls back to its own Canvas renderer without affecting others.
(() => {
  'use strict';

  const { fx, internal } = JuqBawx;
  const { clamp } = fx;
  const { runtime } = internal.state;

  const gpuCanvas = document.createElement('canvas');
  let gpuRenderer = null;
  let gpuUnavailable = false;
  let gpuEventsAttached = false;
  const gpuFailedPrograms = new Set();

  const CHROME_VERTEX_SHADER = `
    attribute vec2 a_position;
    varying vec2 v_uv;

    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const GPU_FRAGMENT_COMMON = `
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec4 u_audio;
    uniform vec4 u_bands_a;
    uniform vec4 u_bands_b;
    uniform vec4 u_params;
    uniform vec3 u_background;
    uniform vec3 u_colors[5];

    varying vec2 v_uv;

    const float GPU_TAU = 6.28318530718;

    float hash11(float value) {
      return fract(sin(value * 127.1) * 43758.5453123);
    }

    float hash21(vec2 value) {
      return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float bandAt(float index) {
      if (index < 0.5) return u_bands_a.x;
      if (index < 1.5) return u_bands_a.y;
      if (index < 2.5) return u_bands_a.z;
      if (index < 3.5) return u_bands_a.w;
      if (index < 4.5) return u_bands_b.x;
      if (index < 5.5) return u_bands_b.y;
      if (index < 6.5) return u_bands_b.z;
      return u_bands_b.w;
    }

    float sampleBand(float position) {
      float scaled = clamp(position, 0.0, 1.0) * 7.0;
      float lower = floor(scaled);
      return mix(bandAt(lower), bandAt(min(7.0, lower + 1.0)), fract(scaled));
    }

    vec3 sampleScenePalette(float position) {
      float scaled = fract(position) * 4.0;
      if (scaled < 1.0) return mix(u_colors[0], u_colors[1], scaled);
      if (scaled < 2.0) return mix(u_colors[1], u_colors[2], scaled - 1.0);
      if (scaled < 3.0) return mix(u_colors[2], u_colors[3], scaled - 2.0);
      return mix(u_colors[3], u_colors[4], scaled - 3.0);
    }
  `;

  const GPU_SCENE_UNIFORMS = [
    'u_resolution', 'u_time', 'u_audio', 'u_bands_a', 'u_bands_b',
    'u_params', 'u_background', 'u_colors[0]'
  ];

  function compileGpuShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Unable to allocate WebGL shader');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || 'WebGL shader compilation failed';
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  function initializeGpuRenderer() {
    if (gpuRenderer || gpuUnavailable) return gpuRenderer;
    try {
      const gl = gpuCanvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        powerPreference: 'high-performance'
      });
      if (!gl) throw new Error('WebGL is unavailable');

      const vertexShader = compileGpuShader(gl, gl.VERTEX_SHADER, CHROME_VERTEX_SHADER);
      const buffer = gl.createBuffer();
      if (!buffer) throw new Error('Unable to allocate WebGL vertex buffer');
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.disable(gl.BLEND);

      gpuRenderer = {
        gl,
        vertexShader,
        buffer,
        programs: new Map()
      };

      if (!gpuEventsAttached && typeof gpuCanvas.addEventListener === 'function') {
        gpuEventsAttached = true;
        gpuCanvas.addEventListener('webglcontextlost', event => {
          event.preventDefault();
          gpuRenderer = null;
          gpuUnavailable = true;
        });
        gpuCanvas.addEventListener('webglcontextrestored', () => {
          gpuUnavailable = false;
          gpuFailedPrograms.clear();
        });
      }
      return gpuRenderer;
    } catch {
      gpuRenderer = null;
      gpuUnavailable = true;
      return null;
    }
  }

  function getGpuProgram(renderer, key, fragmentSource, uniformNames) {
    const cached = renderer.programs.get(key);
    if (cached) return cached;
    if (gpuFailedPrograms.has(key)) return null;
    const gl = renderer.gl;
    let fragmentShader = null;
    let program = null;
    try {
      fragmentShader = compileGpuShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram();
      if (!program) throw new Error('Unable to allocate WebGL program');
      gl.attachShader(program, renderer.vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'WebGL program linking failed');
      }
      const position = gl.getAttribLocation(program, 'a_position');
      if (position < 0) throw new Error('WebGL position attribute is unavailable');
      const uniforms = {};
      for (const name of uniformNames) uniforms[name] = gl.getUniformLocation(program, name);
      const compiled = { program, position, uniforms };
      renderer.programs.set(key, compiled);
      return compiled;
    } catch (error) {
      gpuFailedPrograms.add(key);
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn(`WebGL program "${key}" failed; using its compatibility renderer.`, error);
      }
      if (program) gl.deleteProgram(program);
      return null;
    } finally {
      if (fragmentShader) gl.deleteShader(fragmentShader);
    }
  }

  function prepareGpuProgram(renderer, compiled) {
    const gl = renderer.gl;
    gl.useProgram(compiled.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, renderer.buffer);
    gl.enableVertexAttribArray(compiled.position);
    gl.vertexAttribPointer(compiled.position, 2, gl.FLOAT, false, 0, 0);
  }

  function ensureGpuBufferSize(renderer) {
    const longSides = [480, 800, 1280];
    const longSide = longSides[clamp(Math.round(runtime.shaderQuality), 0, longSides.length - 1)];
    const aspect = fx.width / Math.max(1, fx.height);
    const nextWidth = Math.max(80, Math.round(aspect >= 1 ? longSide : longSide * aspect));
    const nextHeight = Math.max(80, Math.round(aspect >= 1 ? longSide / aspect : longSide));
    if (gpuCanvas.width === nextWidth && gpuCanvas.height === nextHeight) return;
    gpuCanvas.width = nextWidth;
    gpuCanvas.height = nextHeight;
    renderer.gl.viewport(0, 0, nextWidth, nextHeight);
  }

  // Generic entry point: the caller supplies its own uniform names and a
  // callback to set them. Returns false when the GPU path is unavailable, which
  // is the caller's cue to fall back to Canvas.
  function renderCustomGpuScene(key, fragmentSource, uniformNames, applyUniforms) {
    const renderer = initializeGpuRenderer();
    if (!renderer || renderer.gl.isContextLost()) return false;
    const compiled = getGpuProgram(renderer, key, fragmentSource, uniformNames);
    if (!compiled) return false;
    ensureGpuBufferSize(renderer);
    internal.color.refreshPaletteCache();
    prepareGpuProgram(renderer, compiled);
    applyUniforms(renderer.gl, compiled.uniforms, gpuCanvas, internal.color.gpuPaletteColors);
    renderer.gl.drawArrays(renderer.gl.TRIANGLES, 0, 3);
    return true;
  }

  // The standard scene contract: eight interpolated bands, energy, palette,
  // background color, and four scene-specific parameters.
  function renderGpuScene(key, fragmentSource, t, params) {
    return renderCustomGpuScene(key, fragmentSource, GPU_SCENE_UNIFORMS, (gl, uniforms, surface, paletteColors) => {
      const bands = fx.resample(8);
      const background = internal.color.hexToRgb(fx.baseBgColor());
      gl.uniform2f(uniforms.u_resolution, surface.width, surface.height);
      gl.uniform1f(uniforms.u_time, t * 0.001);
      gl.uniform4f(uniforms.u_audio, fx.bass(), fx.mids(), fx.highs(), fx.beat);
      gl.uniform4f(uniforms.u_bands_a, bands[0], bands[1], bands[2], bands[3]);
      gl.uniform4f(uniforms.u_bands_b, bands[4], bands[5], bands[6], bands[7]);
      gl.uniform4f(uniforms.u_params, params[0], params[1], params[2], params[3]);
      gl.uniform3f(uniforms.u_background, background.r / 255, background.g / 255, background.b / 255);
      gl.uniform3fv(uniforms['u_colors[0]'], paletteColors);
    });
  }

  function compositeGpuScene() {
    const ctx = fx.ctx;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(gpuCanvas, 0, 0, fx.width, fx.height);
    internal.canvas.drawAlbumArtBackdrop();
  }

  internal.gpu = { gpuCanvas };

  // Visualizer fragment shaders concatenate this common block.
  JuqBawx.gpuCommon = GPU_FRAGMENT_COMMON;

  fx.gpuCanvas = gpuCanvas;
  fx.renderGpuScene = renderGpuScene;
  fx.renderCustomGpuScene = renderCustomGpuScene;
  fx.compositeGpuScene = compositeGpuScene;
})();
