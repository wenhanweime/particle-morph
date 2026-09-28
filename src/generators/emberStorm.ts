import { createEmptyLayout, gaussian, hash, hash2, mixColor, setParticle } from './helpers';
import type { ParticleLayout } from './types';

/** Tight warm gold/orange hurricane — streaking rotational particles, energetic core */
export function generateEmberStorm(count: number): ParticleLayout {
  const layout = createEmptyLayout(count);
  const { positions, colors, sizes } = layout;

  const arms = 5;
  const coreN = Math.floor(count * 0.12);
  const armN = Math.floor(count * 0.78);
  let i = 0;

  for (; i < coreN; i++) {
    const r = Math.abs(gaussian(hash(i), hash2(i, 1))) * 0.55;
    const th = hash2(i, 2) * Math.PI * 2;
    const y = gaussian(hash2(i, 3), hash2(i, 4)) * 0.25;
    const col = mixColor(1, 0.95, 0.55, 1, 0.5, 0.1, hash2(i, 5));
    setParticle(positions, colors, sizes, i, Math.cos(th) * r, y, Math.sin(th) * r, col[0], col[1], col[2], 0.4 + hash2(i, 6) * 0.35);
  }

  const armEnd = i + armN;
  for (; i < armEnd; i++) {
    const arm = i % arms;
    const t = hash(i);
    const base = (arm / arms) * Math.PI * 2;
    const twist = t * 7.2;
    const radius = 0.2 + t * 6.5;

    // Thick streaking sheets along arms
    const lat = gaussian(hash2(i, 7), hash2(i, 8));
    const width = 0.2 + t * 0.7;
    const offset = Math.tanh(lat * 0.5) * width;
    // Along-stream stretch for streak feel
    const stream = Math.floor(hash2(i, 9) * 220);
    const streamJ = (stream / 220 - 0.5) * 0.04;
    const ang = base + twist + offset * 0.2 + streamJ;

    const y = gaussian(hash2(i, 10), hash2(i, 11)) * (0.15 + t * 0.7) + t * 0.15;
    const x = Math.cos(ang) * (radius + offset * 0.35);
    const z = Math.sin(ang) * (radius + offset * 0.35);

    const spine = Math.exp(-Math.abs(lat) * 1.6);
    const heat = spine * (1 - t * 0.4);
    const col = heat > 0.4
      ? mixColor(1.0, 0.92, 0.4, 1.0, 0.48, 0.08, 1 - heat)
      : mixColor(1.0, 0.48, 0.08, 0.7, 0.12, 0.03, 1 - heat * 2);
    const bright = 0.3 + heat * 0.7;
    const sz = 0.14 + spine * 0.35 + (1 - t) * 0.15;
    setParticle(positions, colors, sizes, i, x, y, z, col[0] * bright, col[1] * bright, col[2] * bright, sz);
  }

  for (; i < count; i++) {
    const R = 2 + hash(i) * 9;
    const th = hash2(i, 12) * Math.PI * 2;
    const y = (hash2(i, 13) - 0.3) * 6;
    const col = mixColor(1.0, 0.55, 0.15, 0.9, 0.2, 0.04, hash2(i, 14));
    const b = 0.15 + hash2(i, 15) * 0.45;
    setParticle(positions, colors, sizes, i, Math.cos(th) * R, y, Math.sin(th) * R, col[0] * b, col[1] * b, col[2] * b, 0.12 + hash2(i, 16) * 0.15);
  }
  return layout;
}
