// Lively's audio bridge, band smoothing, beat detection, and spectrum resampling.
(() => {
  'use strict';

  const { fx, internal } = JuqBawx;
  const { clamp, lerp } = fx;
  const { runtime } = internal.state;

  const audio = new Float32Array(128);
  const target = new Float32Array(128);
  const previous = new Float32Array(128);
  const audioPrefix = new Float32Array(129);
  const resamplePlans = new Map();

  let frameBass = 0;
  let frameMids = 0;
  let frameHighs = 0;
  let frameEnergy = 0;
  let lastAudioAt = 0;
  let beat = 0;
  let previousBass = 0;

  const bass = () => frameBass;
  const mids = () => frameMids;
  const highs = () => frameHighs;
  const energy = () => frameEnergy;

  function avg(arr, a, b) {
    const start = Math.max(0, Math.floor(a));
    const end = Math.min(arr.length, Math.ceil(b));
    const count = end - start;
    if (!count) return 0;
    if (arr === audio) return (audioPrefix[end] - audioPrefix[start]) / count;
    let s = 0;
    for (let i = start; i < end; i++) {
      s += arr[i];
    }
    return s / count;
  }

  function resample(count) {
    const safeCount = clamp(Math.round(count), 1, 128);
    let plan = resamplePlans.get(safeCount);
    if (!plan) {
      const starts = new Uint8Array(safeCount);
      const ends = new Uint8Array(safeCount);
      const lowWeights = new Float32Array(safeCount);
      const values = new Float32Array(safeCount);
      for (let i = 0; i < safeCount; i++) {
        const r0 = i / safeCount;
        const r1 = (i + 1) / safeCount;
        starts[i] = Math.floor(Math.pow(r0, 1.45) * 118);
        ends[i] = Math.ceil(Math.pow(r1, 1.45) * 118);
        lowWeights[i] = clamp(1 - r0 * 1.8, 0, 1);
      }
      plan = { starts, ends, lowWeights, values };
      resamplePlans.set(safeCount, plan);
    }
    const bassBoost = runtime.bassBoost - 1;
    for (let i = 0; i < safeCount; i++) {
      const start = plan.starts[i];
      const end = plan.ends[i];
      const average = (audioPrefix[end] - audioPrefix[start]) / Math.max(1, end - start);
      const value = average * runtime.sensitivity * (1 + bassBoost * plan.lowWeights[i]);
      plan.values[i] = clamp(value, 0, 1.5);
    }
    return plan.values;
  }

  function updateAudio(now) {
    const idle = now - lastAudioAt > 550;
    const smooth = clamp(runtime.smoothing, 0, 0.95);
    const attack = 0.34 + (1 - smooth) * 0.44;
    const release = 0.035 + (1 - smooth) * 0.12;
    let total = 0;
    audioPrefix[0] = 0;
    for (let i = 0; i < 128; i++) {
      let v = target[i] || 0;
      if (idle && runtime.idleMotion) {
        const floor = 0.015 + 0.012 * Math.sin(now * 0.00042 + i * 0.25) + 0.008 * Math.sin(now * 0.00021 + i * 0.07);
        v = Math.max(v, clamp(floor, 0, 0.05));
      }
      audio[i] = lerp(audio[i], v, v > audio[i] ? attack : release);
      previous[i] = Math.max(audio[i], previous[i] * 0.965);
      if (idle) target[i] *= 0.9;
      total += audio[i];
      audioPrefix[i + 1] = total;
    }
    frameBass = audioPrefix[12] / 12;
    frameMids = (audioPrefix[55] - audioPrefix[12]) / 43;
    frameHighs = (audioPrefix[115] - audioPrefix[55]) / 60;
    frameEnergy = audioPrefix[110] / 110;
    if (frameBass > previousBass * 1.22 && frameBass > 0.2) beat = 1;
    beat = Math.max(0, beat * 0.92 - 0.004);
    previousBass = lerp(previousBass, frameBass, 0.25);
    fx.beat = beat;
  }

  window.livelyAudioListener = function(audioArray) {
    if (!audioArray || typeof audioArray.length !== 'number') return;
    lastAudioAt = performance.now();
    const n = Math.min(128, audioArray.length);
    for (let i = 0; i < n; i++) {
      const raw = Number(audioArray[i]);
      target[i] = Number.isFinite(raw) ? clamp(raw, 0, 1.5) : 0;
    }
    for (let i = n; i < 128; i++) target[i] = 0;
  };

  internal.audio = { updateAudio };

  fx.audio = audio;
  fx.previous = previous;
  fx.beat = 0;
  fx.bass = bass;
  fx.mids = mids;
  fx.highs = highs;
  fx.energy = energy;
  fx.avg = avg;
  fx.resample = resample;
})();
