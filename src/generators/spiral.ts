import { createEmptyLayout, gaussian, hash, hash2, setParticle, vnoise } from './helpers';
import type { ParticleLayout } from './types';

/**
 * Massive volumetric dust vortex via continuous density field with ridge modulation.
 */
export function generateSpiral(count: number): ParticleLayout {
  const layout = createEmptyLayout(count);
  const { positions, colors, sizes } = layout;

  const ridges = 5;
  const coreN = Math.floor(count * 0.2);
  const bodyN = Math.floor(count * 0.72);
  let i = 0;

  for (; i < coreN; i++) {
    const r = Math.pow(Math.abs(gaussian(hash(i), hash2(i, 1))), 0.75) * 1.3;
    const th = hash2(i, 2) * Math.PI * 2;
    const y = -0.7 + gaussian(hash2(i, 3), hash2(i, 4)) * 0.5;
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r * 0.9;
    const b = 0.65 + hash2(i, 5) * 0.35;
    setParticle(positions, colors, sizes, i, x, y, z, b, b, b, 0.35 + (1 - Math.min(1, r / 1.3)) * 0.45);
  }

  const bodyEnd = i + bodyN;
  for (; i < bodyEnd; i++) {
    // Height / progress along funnel 0..1
    const t = Math.pow(hash(i), 0.7);
    const y = -0.6 + t * 6.2;

    // Base funnel radius at this height
    const r0 = 1.0 + t * 7.5;

    // Random angle then bias toward ridge centers for sheet look while filling volume
    let ang = hash2(i, 6) * Math.PI * 2;
    const twist = t * 5.5;
    const ridgePhase = (ang + twist) * ridges;
    // Distance to nearest ridge (0 = on ridge)
    const toRidge = Math.abs(((ridgePhase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI) / Math.PI; // 0..1
    // Pull most particles toward ridges but leave filler for volume
    const pull = Math.pow(toRidge, 0.35);
    ang -= (ang - (Math.floor((ang + twist) * ridges / (Math.PI * 2) + 0.5) * (Math.PI * 2) / ridges - twist)) * (0.55 + hash2(i, 7) * 0.25);

    // Radial fill: thick shell around funnel surface + interior dust
    const radialMode = hash2(i, 8);
    let r: number;
    if (radialMode < 0.78) {
      // Thick wall around funnel surface
      r = r0 + (hash2(i, 9) - 0.5) * (2.2 + t * 2.8);
    } else if (radialMode < 0.9) {
      // Interior swirling mass
      r = hash2(i, 10) * r0 * 0.85;
    } else {
      // Outer wisps
      r = r0 + 1.2 + hash2(i, 11) * 2.5;
    }

    const wave = Math.sin((ang + twist) * 2 + t * 8) * 0.25 * t
      + (vnoise(ang * 2 + t * 5) - 0.5) * 0.4;
    r += wave;

    const x = Math.cos(ang) * r;
    const z = Math.sin(ang) * r - t * 1.2;
    const yJ = y + gaussian(hash2(i, 12), hash2(i, 13)) * (0.25 + t * 0.35);

    const ridgeDens = Math.exp(-toRidge * toRidge * 3.5);
    const dens = 0.35 + ridgeDens * 0.65;
    const bright = (0.12 + dens * 0.75) * (1 - t * 0.15) + hash2(i, 14) * 0.05;
    const sz = 0.14 + dens * 0.32 + (1 - t) * 0.12;
    setParticle(positions, colors, sizes, i, x, yJ, z, bright, bright, bright * 0.98, sz);
  }

  for (; i < count; i++) {
    const R = 8 + hash(i) * 16;
    const th = hash2(i, 15) * Math.PI * 2;
    const ph = Math.acos(2 * hash2(i, 16) - 1);
    const b = 0.15 + hash2(i, 17) * 0.5;
    setParticle(positions, colors, sizes, i,
      R * Math.sin(ph) * Math.cos(th),
      R * Math.sin(ph) * Math.sin(th) * 0.7,
      R * Math.cos(ph),
      b, b, b, 0.1 + hash2(i, 18) * 0.22);
  }
  return layout;
}
