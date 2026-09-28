import { createEmptyLayout, gaussian, hash, hash2, mixColor, setParticle } from './helpers';
import type { ParticleLayout } from './types';

/**
 * Volumetric spherical aura: dense shells, cyan→gold→orange falloff, soft rays.
 * Not a white flood, not sparse spokes only.
 */
export function generateRadialAura(count: number): ParticleLayout {
  const layout = createEmptyLayout(count);
  const { positions, colors, sizes } = layout;

  const coreN = Math.floor(count * 0.05);
  const volN = Math.floor(count * 0.45); // filled volume with falloff
  const shellN = Math.floor(count * 0.32);
  const rayN = Math.floor(count * 0.14);
  let i = 0;

  for (; i < coreN; i++) {
    const r = Math.abs(gaussian(hash(i), hash2(i, 1))) * 0.4;
    const th = hash2(i, 2) * Math.PI * 2;
    const ph = Math.acos(2 * hash2(i, 3) - 1);
    const col = mixColor(0.9, 0.98, 1.0, 0.35, 0.95, 1.0, hash2(i, 4));
    setParticle(positions, colors, sizes, i,
      r * Math.sin(ph) * Math.cos(th),
      r * Math.sin(ph) * Math.sin(th),
      r * Math.cos(ph),
      col[0], col[1], col[2], 0.32 + hash2(i, 5) * 0.2);
  }

  // Volumetric ball with density falloff (aura body)
  const volEnd = i + volN;
  for (; i < volEnd; i++) {
    const u = hash(i);
    // Prefer mid radii, thinner near outer
    const r = 0.5 + Math.pow(u, 0.7) * 3.8;
    const th = hash2(i, 6) * Math.PI * 2;
    const ph = Math.acos(2 * hash2(i, 7) - 1);
    const x = r * Math.sin(ph) * Math.cos(th);
    const y = r * Math.sin(ph) * Math.sin(th);
    const z = r * Math.cos(ph);
    const t = Math.min(1, (r - 0.4) / 4.0);
    let col: [number, number, number];
    if (t < 0.3) col = mixColor(0.25, 0.95, 1.0, 0.75, 0.95, 0.75, t / 0.3);
    else if (t < 0.6) col = mixColor(0.75, 0.95, 0.75, 1.0, 0.82, 0.28, (t - 0.3) / 0.3);
    else col = mixColor(1.0, 0.82, 0.28, 1.0, 0.3, 0.06, (t - 0.6) / 0.4);
    const dens = Math.exp(-t * 1.4);
    const bright = (0.25 + dens * 0.55) * (0.8 + hash2(i, 8) * 0.2);
    setParticle(positions, colors, sizes, i, x, y, z, col[0] * bright, col[1] * bright, col[2] * bright, 0.14 + dens * 0.2);
  }

  // Distinct shell layers
  const shellEnd = i + shellN;
  for (; i < shellEnd; i++) {
    const shell = Math.floor(hash(i) * 8);
    const baseR = 1.0 + shell * 0.52;
    const r = baseR + gaussian(hash2(i, 9), hash2(i, 10)) * 0.04;
    const th = hash2(i, 11) * Math.PI * 2;
    const ph = Math.acos(2 * hash2(i, 12) - 1);
    const x = r * Math.sin(ph) * Math.cos(th);
    const y = r * Math.sin(ph) * Math.sin(th);
    const z = r * Math.cos(ph);
    const t = Math.min(1, (r - 0.8) / 4.2);
    let col: [number, number, number];
    if (t < 0.35) col = mixColor(0.2, 0.95, 1.0, 1.0, 0.9, 0.4, t / 0.35);
    else col = mixColor(1.0, 0.9, 0.4, 1.0, 0.28, 0.05, (t - 0.35) / 0.65);
    const on = Math.exp(-Math.abs(r - baseR) * 18);
    const bright = 0.35 + on * 0.5;
    setParticle(positions, colors, sizes, i, x, y, z, col[0] * bright, col[1] * bright, col[2] * bright, 0.14 + on * 0.12);
  }

  // Soft rays (not sparse spokes only)
  const rayEnd = i + rayN;
  for (; i < rayEnd; i++) {
    const ray = Math.floor(hash(i) * 72);
    const th = (ray / 72) * Math.PI * 2;
    const ph = ((ray * 17) % 72) / 72 * Math.PI;
    const t = 1.0 + hash2(i, 13) * 5.0;
    const jitter = gaussian(hash2(i, 14), hash2(i, 15)) * 0.08;
    const x = (t + jitter) * Math.sin(ph) * Math.cos(th);
    const y = (t + jitter) * Math.sin(ph) * Math.sin(th);
    const z = (t + jitter) * Math.cos(ph);
    const u = Math.min(1, t / 5.5);
    const col = u < 0.4
      ? mixColor(0.4, 0.95, 1.0, 1.0, 0.85, 0.35, u / 0.4)
      : mixColor(1.0, 0.85, 0.35, 1.0, 0.25, 0.04, (u - 0.4) / 0.6);
    const bright = 0.28 + (1 - u) * 0.5;
    setParticle(positions, colors, sizes, i, x, y, z, col[0] * bright, col[1] * bright, col[2] * bright, 0.12 + (1 - u) * 0.12);
  }

  for (; i < count; i++) {
    const r = 5.5 + hash(i) * 4;
    const th = hash2(i, 16) * Math.PI * 2;
    const ph = Math.acos(2 * hash2(i, 17) - 1);
    const col = mixColor(1.0, 0.35, 0.08, 1.0, 0.75, 0.25, hash2(i, 18));
    const b = 0.2 + hash2(i, 19) * 0.35;
    setParticle(positions, colors, sizes, i,
      r * Math.sin(ph) * Math.cos(th),
      r * Math.sin(ph) * Math.sin(th),
      r * Math.cos(ph),
      col[0] * b, col[1] * b, col[2] * b, 0.1 + hash2(i, 20) * 0.12);
  }
  return layout;
}
