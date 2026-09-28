import { createEmptyLayout, gaussian, hash, hash2, setParticle, vnoise } from './helpers';
import type { ParticleLayout } from './types';

/**
 * Continuous funnel wall with sand-dune ridges (not thin contour wires).
 */
export function generateTunnel(count: number): ParticleLayout {
  const layout = createEmptyLayout(count);
  const { positions, colors, sizes } = layout;

  const wallN = Math.floor(count * 0.93);
  const figN = 8;
  let i = 0;

  for (; i < wallN; i++) {
    // Continuous depth 0 (near) .. 1 (deep)
    const depthT = Math.pow(hash(i), 0.85);
    const angle = hash2(i, 1) * Math.PI * 2;

    // Funnel radius
    const rFunnel = 1.2 + (1 - depthT) * 5.6;

    // Sand-dune ridges: continuous sine ridges along wall + noise
    const dune =
      Math.sin(angle * 3 + depthT * 14) * 0.45 +
      Math.sin(angle * 5 - depthT * 9) * 0.22 +
      (vnoise(angle * 2 + depthT * 6) - 0.5) * 0.5;

    // Thick wall: particles fill a band around the funnel surface
    // Pack tightly to surface so walls read as solid sheets
    const wallThick = 0.35 + (1 - depthT) * 0.55;
    const radialOff = gaussian(hash2(i, 2), hash2(i, 20)) * wallThick * 0.55;
    const crest = 0.5 + 0.5 * Math.sin(angle * 3 + depthT * 14);
    let r = rFunnel + dune * 0.85 + radialOff;
    r = Math.max(0.95 + (1 - depthT) * 0.3, r);

    const swirl = depthT * 0.7;
    const a = angle + swirl;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = 5.5 - depthT * depthT * 9.5 - depthT * 3.5
      + gaussian(hash2(i, 3), hash2(i, 4)) * 0.08;

    const near = 1 - depthT;
    // Skip some particles deep in troughs to keep ridge readable but wall solid
    const keep = 0.4 + crest * 0.6;
    const bright = (0.28 + near * 0.72) * keep + hash2(i, 5) * 0.04;
    const sz = 0.15 + near * 0.3 + crest * 0.1;
    setParticle(positions, colors, sizes, i, x, y, z, bright, bright, bright, sz);
  }

  const figEnd = i + figN;
  for (; i < figEnd; i++) {
    setParticle(positions, colors, sizes, i,
      gaussian(hash(i), hash2(i, 6)) * 0.02,
      -6.6 + hash2(i, 7) * 0.45,
      gaussian(hash2(i, 8), hash2(i, 9)) * 0.02,
      1, 1, 1, 0.45);
  }

  for (; i < count; i++) {
    const th = hash(i) * Math.PI * 2;
    const R = 9 + hash2(i, 10) * 12;
    const y = (hash2(i, 11) - 0.4) * 18;
    const b = 0.1 + hash2(i, 12) * 0.4;
    setParticle(positions, colors, sizes, i, Math.cos(th) * R, y, Math.sin(th) * R, b, b, b, 0.1 + hash2(i, 13) * 0.16);
  }
  return layout;
}
