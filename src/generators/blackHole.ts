import { createEmptyLayout, gaussian, hash, hash2, setParticle } from './helpers';
import type { ParticleLayout } from './types';

/**
 * Gargantua: pure black void, bright streaky accretion disk, strong photon-ring
 * lensing arcs top/bottom, dense starfield. Bloom off externally.
 */
export function generateBlackHole(count: number): ParticleLayout {
  const layout = createEmptyLayout(count);
  const { positions, colors, sizes } = layout;

  const voidR = 1.5;
  const diskN = Math.floor(count * 0.34);
  const lensN = Math.floor(count * 0.42);
  const starN = count - diskN - lensN;

  const tilt = (62 * Math.PI) / 180;
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);

  let i = 0;

  // Streaky thin accretion disk — bright inner rim
  for (; i < diskN; i++) {
    // Bias heavily to inner bright rim
    const t = Math.pow(hash(i), 2.1);
    const r = voidR + 0.08 + t * 7.2;
    const spiral = Math.log(r / voidR) * 5.5;
    // Many particles share similar angles → streaky streamlines
    const stream = Math.floor(hash2(i, 1) * 180);
    const ang = (stream / 180) * Math.PI * 2 + spiral + gaussian(hash2(i, 2), hash2(i, 3)) * 0.008;

    const rr = r + gaussian(hash2(i, 4), hash2(i, 5)) * 0.018;
    const lx = Math.cos(ang) * rr;
    const lz = Math.sin(ang) * rr;
    const ly = gaussian(hash2(i, 6), hash2(i, 7)) * 0.01;

    const y = ly * cosT - lz * sinT;
    const z = ly * sinT + lz * cosT;
    const x = lx;

    const rim = Math.exp(-Math.abs(rr - voidR - 0.15) * 3.5);
    const fall = Math.exp(-Math.max(0, rr - voidR) * 0.18);
    const bright = 0.4 + rim * 1.05 + fall * 0.4;
    const sz = 0.12 + rim * 0.4 + hash2(i, 8) * 0.08;
    setParticle(positions, colors, sizes, i, x, y, z, bright, bright, bright, sz);
  }

  // Strong photon-ring / lensing arcs wrapping top & bottom
  const lensEnd = i + lensN;
  for (; i < lensEnd; i++) {
    const side = hash(i) > 0.5 ? 1 : -1;
    const u = hash2(i, 9);
    // Dense arc occupancy
    const phi = (u - 0.5) * Math.PI * 1.7;
    let lat = side * (0.35 + hash2(i, 10) * 0.75);
    lat += gaussian(hash2(i, 30), hash2(i, 31)) * 0.1;
    const arcR = voidR * (1.015 + hash2(i, 11) * 0.05);

    let x = arcR * Math.cos(lat) * Math.sin(phi) * 1.85;
    let y = arcR * Math.sin(lat) * 0.95;
    let z = arcR * Math.cos(lat) * Math.cos(phi) * 0.7;

    const y2 = y * cosT - z * sinT * 0.4;
    const z2 = y * sinT * 0.4 + z;

    const d = Math.sqrt(x * x + y2 * y2 + z2 * z2);
    if (d < voidR * 1.02) {
      const s = (voidR * 1.05) / Math.max(d, 1e-4);
      x *= s;
      setParticle(positions, colors, sizes, i, x, y2 * s, z2 * s,
        0.85, 0.85, 0.85, 0.22 + hash2(i, 12) * 0.2);
      continue;
    }

    // Keep face-center of void clear
    if (Math.abs(x) < voidR * 0.3 && Math.abs(y2) < voidR * 0.28 && z2 > 0) {
      x += (x >= 0 ? 1 : -1) * voidR * 0.55;
    }

    // Brighter near equator of arcs (classic photon ring look)
    const ringBoost = Math.exp(-Math.abs(Math.abs(lat) - 0.7) * 3);
    const bright = 0.65 + ringBoost * 0.5 + hash2(i, 13) * 0.1;
    setParticle(positions, colors, sizes, i, x, y2, z2, bright, bright, bright, 0.15 + ringBoost * 0.25);
  }

  // Dense starfield
  for (; i < count; i++) {
    const R = 3.5 + hash(i) * 20;
    const th = hash2(i, 14) * Math.PI * 2;
    const ph = Math.acos(2 * hash2(i, 15) - 1);
    let x = R * Math.sin(ph) * Math.cos(th);
    let y = R * Math.sin(ph) * Math.sin(th);
    let z = R * Math.cos(ph);
    const d = Math.sqrt(x * x + y * y + z * z);
    if (d < voidR * 2.5) {
      const s = (voidR * 2.7 + hash2(i, 16)) / Math.max(d, 0.01);
      x *= s; y *= s; z *= s;
    }
    const b = 0.22 + hash2(i, 17) * 0.6;
    setParticle(positions, colors, sizes, i, x, y, z, b, b, b, 0.1 + hash2(i, 18) * 0.22);
  }
  return layout;
}
