import { createEmptyLayout, gaussian, hash, hash2, setParticle } from './helpers';
import type { ParticleLayout } from './types';

/** Explosive upward white splash — dense liquid clusters + mist trails */
export function generateSplash(count: number): ParticleLayout {
  const layout = createEmptyLayout(count);
  const { positions, colors, sizes } = layout;

  const coreN = Math.floor(count * 0.1);
  const blobN = Math.floor(count * 0.35);
  const jetN = Math.floor(count * 0.4);
  let i = 0;

  // Impact core
  for (; i < coreN; i++) {
    const r = Math.abs(gaussian(hash(i), hash2(i, 1))) * 0.55;
    const th = hash2(i, 2) * Math.PI * 2;
    const ph = hash2(i, 3) * Math.PI;
    setParticle(positions, colors, sizes, i,
      r * Math.sin(ph) * Math.cos(th),
      r * Math.cos(ph) * 0.5,
      r * Math.sin(ph) * Math.sin(th),
      1, 1, 1, 0.4 + hash2(i, 4) * 0.35);
  }

  // Dense liquid BLOBS (clustered)
  const blobEnd = i + blobN;
  for (; i < blobEnd; i++) {
    const blob = Math.floor(hash(i) * 18);
    const elev = 0.3 + hash2(blob, 50) * 0.7;
    const ang = hash2(blob, 51) * Math.PI * 2;
    const dist = 0.8 + hash2(blob, 52) * 5.5;
    const cx = Math.cos(ang) * Math.cos(elev) * dist;
    const cy = Math.sin(elev) * dist * 1.15;
    const cz = Math.sin(ang) * Math.cos(elev) * dist;
    const s = 0.15 + hash2(blob, 53) * 0.55;
    const x = cx + gaussian(hash2(i, 5), hash2(i, 6)) * s;
    const y = cy + gaussian(hash2(i, 7), hash2(i, 8)) * s * 0.7;
    const z = cz + gaussian(hash2(i, 9), hash2(i, 10)) * s;
    const t = Math.min(1, dist / 6);
    const bright = 0.4 + (1 - t) * 0.6;
    setParticle(positions, colors, sizes, i, x, y, z, bright, bright, bright, 0.18 + (1 - t) * 0.3);
  }

  // Mist trails / spray
  const jetEnd = i + jetN;
  for (; i < jetEnd; i++) {
    const t = Math.pow(hash(i), 0.6);
    const jet = Math.floor(hash2(i, 11) * 12);
    const jetAng = (jet / 12) * Math.PI * 2 + hash2(i, 12) * 0.4;
    const elev = 0.45 + hash2(i, 13) * 0.5;
    const speed = 0.5 + t * 8.5;
    const spread = t * 2.0 * hash2(i, 14);
    const x = Math.cos(jetAng) * Math.cos(elev * 1.3) * speed + gaussian(hash2(i, 15), hash2(i, 16)) * spread;
    const y = Math.sin(elev * 1.4) * speed * 1.25 + Math.abs(gaussian(hash2(i, 17), hash2(i, 18))) * 0.5;
    const z = Math.sin(jetAng) * Math.cos(elev * 1.3) * speed + gaussian(hash2(i, 19), hash2(i, 20)) * spread;
    const bright = 0.3 + (1 - t) * 0.7;
    setParticle(positions, colors, sizes, i, x, y, z, bright, bright, bright, 0.14 + (1 - t) * 0.28);
  }

  for (; i < count; i++) {
    const x = gaussian(hash(i), hash2(i, 21)) * 7;
    const y = hash2(i, 22) * 7;
    const z = gaussian(hash2(i, 23), hash2(i, 24)) * 7;
    const b = 0.08 + hash2(i, 25) * 0.28;
    setParticle(positions, colors, sizes, i, x, y, z, b, b, b, 0.1 + hash2(i, 26) * 0.15);
  }
  return layout;
}
