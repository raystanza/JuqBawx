(() => {
  'use strict';

  let gardenParticles = [];

  JuqBawx.register({
    id: 'gravity-garden',
    name: 'Gravity Garden',
    categories: ['interactive'],
    tuning: { sensitivity: 1.04, glow: 1.08, trail: 1.25, beat: 1.18 },
    resize(fx) {
      const { width, height, TAU } = fx;
      const count = Math.max(72, Math.min(150, Math.floor((width * height) / 15000)));
      gardenParticles = Array.from({ length: count }, (_, index) => {
        const angle = Math.random() * TAU;
        const radius = Math.pow(Math.random(), 0.65) * 0.45;
        return {
          x: 0.5 + Math.cos(angle) * radius,
          y: 0.5 + Math.sin(angle) * radius,
          vx: (Math.random() - 0.5) * 0.00045,
          vy: (Math.random() - 0.5) * 0.00045,
          size: 0.6 + Math.random() * 2.2,
          phase: Math.random() * TAU,
          band: index % 112
        };
      });
    },
    draw(fx, t) {
      const { ctx, width, height, runtime, audio, energy, beat, frameMotionScale, pointer, palette, rgba, clearBackground, backdropGlow, clamp, TAU } = fx;
      clearBackground(0.22);
      backdropGlow(t, 0.9);
      const e = energy();
      const px = pointer.active ? pointer.x : 0.5 + Math.sin(t * 0.00017) * 0.16;
      const py = pointer.active ? pointer.y : 0.5 + Math.cos(t * 0.00013) * 0.12;
      const strength = runtime.interactionEnabled ? runtime.interactionStrength : 0;
      const timeStep = clamp(frameMotionScale, 0.25, 2.5);

      for (let index = 0; index < gardenParticles.length; index++) {
        const particle = gardenParticles[index];
        const dx = px - particle.x;
        const dy = py - particle.y;
        const distance2 = dx * dx + dy * dy + 0.006;
        const distance = Math.sqrt(distance2);
        const audioValue = audio[particle.band] || 0;
        const force = (0.000004 + audioValue * 0.000006 + pointer.impulse * 0.000018) * strength / distance2;
        if (runtime.interactionMode === 2) {
          particle.vx += (-dy / distance) * force;
          particle.vy += (dx / distance) * force;
        } else {
          const direction = runtime.interactionMode === 1 ? -1 : 1;
          particle.vx += (dx / distance) * force * direction;
          particle.vy += (dy / distance) * force * direction;
        }
        particle.vx += Math.cos(t * 0.00022 + particle.phase) * (0.000002 + e * 0.000004);
        particle.vy += Math.sin(t * 0.00019 + particle.phase) * (0.000002 + e * 0.000004);
        particle.vx *= 0.984;
        particle.vy *= 0.984;
        particle.x += particle.vx * timeStep;
        particle.y += particle.vy * timeStep;
        if (particle.x < -0.04) particle.x = 1.04;
        if (particle.x > 1.04) particle.x = -0.04;
        if (particle.y < -0.04) particle.y = 1.04;
        if (particle.y > 1.04) particle.y = -0.04;
      }

      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 0.65;
      for (let index = 0; index < gardenParticles.length; index++) {
        const particle = gardenParticles[index];
        for (let next = index + 1; next < Math.min(gardenParticles.length, index + 9); next++) {
          const neighbor = gardenParticles[next];
          const dx = (particle.x - neighbor.x) * width;
          const dy = (particle.y - neighbor.y) * height;
          const distance = Math.hypot(dx, dy);
          if (distance > 105) continue;
          ctx.strokeStyle = palette(t, (index % 13) / 12, (1 - distance / 105) * (0.04 + e * 0.16));
          ctx.beginPath();
          ctx.moveTo(particle.x * width, particle.y * height);
          ctx.lineTo(neighbor.x * width, neighbor.y * height);
          ctx.stroke();
        }
        const audioValue = audio[particle.band] || 0;
        const radius = particle.size * (1 + audioValue * 5 + beat * runtime.beatPulse * 1.8);
        const x = particle.x * width;
        const y = particle.y * height;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 4.5);
        glow.addColorStop(0, palette(t, (index % 17) / 16, 0.85));
        glow.addColorStop(0.25, palette(t, (index % 17) / 16, 0.3));
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, radius * 4.5, 0, TAU);
        ctx.fill();
      }
      if (runtime.interactionEnabled && pointer.active) {
        const radius = Math.min(width, height) * (0.045 + pointer.impulse * 0.05);
        ctx.strokeStyle = palette(t, 0.12, 0.28 + pointer.impulse * 0.38);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(px * width, py * height, radius, 0, TAU);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
