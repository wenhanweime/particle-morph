import { createEmptyLayout, gaussian, hash, hash2, setParticle, vnoise } from './helpers';
import type { ParticleLayout } from './types';

/**
 * Bright textured horizon at bottom + thick grainy S/C curved arm rising from
 * concentrated glowing source. Wispy edges + starfield.
 */
export function generateNebulaArm(count: number): ParticleLayout {
  const layout = createEmptyLayout(count);
  const { positions, colors, sizes } = layout;

  const horizonN = Math.floor(count * 0.34);
  const armN = Math.floor(count * 0.55);
  const mistN = Math.floor(count * 0.07);
  let i = 0;
  const groundY = -1.35;

  // Wide bright HORIZON / ground plane filling lower third of frame
  for (; i < horizonN; i++) {
    const u = hash(i);
    const v = hash2(i, 1);
    // Fan of particles on ground, denser toward vanishing glow
    const x = (u - 0.5) * 18;
    const z = 0.2 + v * 7.5;
    const hz = Math.exp(-Math.pow(z - 2.4, 2) * 0.18);
    const cx = Math.exp(-(x * x) / 3.2);
    const glow = Math.max(hz * 0.5, cx * hz);
    const y = groundY + vnoise(x * 3 + z * 2) * 0.28 + glow * 0.45;
    const bright = 0.25 + hz * 0.5 + glow * 0.95 + hash2(i, 2) * 0.05;
    const sz = 0.22 + glow * 0.75 + hz * 0.25;
    setParticle(positions, colors, sizes, i, x, y, z, bright, bright, bright, sz);
  }

  // Thick S-curved arm from horizon center
  const armEnd = i + armN;
  for (; i < armEnd; i++) {
    const t = hash(i);
    // Strong S: start at horizon glow, curve left then sweep up-right
    const p0x = 0.0, p0y = groundY + 0.35, p0z = 2.1;
    const p1x = -1.8, p1y = -0.2, p1z = 1.5;
    const p2x = 0.6, p2y = 2.8, p2z = 0.3;
    const p3x = 3.8, p3y = 6.8, p3z = -1.4;
    const u = 1 - t;
    const bx = u*u*u*p0x + 3*u*u*t*p1x + 3*u*t*t*p2x + t*t*t*p3x;
    const by = u*u*u*p0y + 3*u*u*t*p1y + 3*u*t*t*p2y + t*t*t*p3y;
    const bz = u*u*u*p0z + 3*u*u*t*p1z + 3*u*t*t*p2z + t*t*t*p3z;

    // Thick volume — denser spine, wispy edges
    const width = 1.1 + t * 2.6;
    const rr = Math.pow(hash2(i, 3), 0.4) * width;
    const aa = hash2(i, 4) * Math.PI * 2;

    // Tangent frame
    const t2 = Math.min(1, t + 0.015);
    const u2 = 1 - t2;
    const bx2 = u2*u2*u2*p0x + 3*u2*u2*t2*p1x + 3*u2*t2*t2*p2x + t2*t2*t2*p3x;
    const by2 = u2*u2*u2*p0y + 3*u2*u2*t2*p1y + 3*u2*t2*t2*p2y + t2*t2*t2*p3y;
    const bz2 = u2*u2*u2*p0z + 3*u2*u2*t2*p1z + 3*u2*t2*t2*p2z + t2*t2*t2*p3z;
    let tx = bx2 - bx, ty = by2 - by, tz = bz2 - bz;
    const tl = Math.hypot(tx, ty, tz) || 1;
    tx /= tl; ty /= tl; tz /= tl;
    let px = -tz, py = 0, pz = tx;
    const pl = Math.hypot(px, pz) || 1;
    px /= pl; pz /= pl;
    const qx = ty * pz - tz * py;
    const qy = tz * px - tx * pz;
    const qz = tx * py - ty * px;

    const turb = (vnoise(t * 22 + aa) - 0.5) * width * 0.25;
    const ox = (px * Math.cos(aa) + qx * Math.sin(aa)) * rr + turb * 0.4;
    const oy = (py * Math.cos(aa) + qy * Math.sin(aa)) * rr * 0.5;
    const oz = (pz * Math.cos(aa) + qz * Math.sin(aa)) * rr;

    const spine = Math.exp(-(rr / Math.max(width, 0.01)) * 2.2);
    const dens = spine * (0.65 + 0.35 * vnoise(t * 14 + rr * 3));
    const bright = (0.15 + dens * 0.85) * (0.8 + (1 - t) * 0.25);
    const sz = 0.16 + dens * 0.4 + (1 - t) * 0.18;
    setParticle(positions, colors, sizes, i, bx + ox, by + oy, bz + oz, bright, bright, bright * 0.97, sz);
  }

  const mistEnd = i + mistN;
  for (; i < mistEnd; i++) {
    const t = hash(i);
    const x = -1 + t * 5 + gaussian(hash2(i, 5), hash2(i, 6)) * 2.5;
    const y = groundY + 0.5 + t * 7 + Math.abs(gaussian(hash2(i, 7), hash2(i, 8))) * 1.2;
    const z = 1.8 - t * 2.8 + gaussian(hash2(i, 9), hash2(i, 10)) * 1.6;
    const b = 0.1 + hash2(i, 11) * 0.25;
    setParticle(positions, colors, sizes, i, x, y, z, b, b, b, 0.12 + hash2(i, 12) * 0.15);
  }

  for (; i < count; i++) {
    const x = (hash(i) - 0.5) * 22;
    const y = (hash2(i, 13) - 0.05) * 16;
    const z = (hash2(i, 14) - 0.5) * 14;
    const b = 0.12 + hash2(i, 15) * 0.55;
    setParticle(positions, colors, sizes, i, x, y, z, b, b, b, 0.1 + hash2(i, 16) * 0.25);
  }
  return layout;
}
