import { createEmptyLayout, gaussian, hash, hash2, mixColor, setParticle, vnoise } from './helpers';
import type { ParticleLayout } from './types';

/** Horizontal layered mist ridges — teal body + gold highlights, painterly depth */
export function generateMistMountains(count: number): ParticleLayout {
  const layout = createEmptyLayout(count);
  const { positions, colors, sizes } = layout;

  const layers = 9;
  const per = Math.floor(count / layers);
  let i = 0;

  for (let L = 0; L < layers; L++) {
    const end = L === layers - 1 ? count : i + per;
    const baseY = -2.4 + L * 0.55;
    const zBase = -L * 1.65;
    const layerT = L / (layers - 1);

    for (; i < end; i++) {
      const x = (hash(i) - 0.5) * (14 + L * 1.4);
      const ridge =
        Math.sin(x * 0.4 + L * 1.5) * 1.3 +
        Math.sin(x * 1.1 + L * 0.55) * 0.55 +
        Math.sin(x * 2.4 + L) * 0.25 +
        (vnoise(x * 0.28 + L * 2) - 0.5) * 0.5;
      const peak = Math.max(0, ridge);
      // Volumetric mist: many particles above ridge line
      const mistLift = Math.pow(hash2(i, 1), 0.7) * (0.6 + layerT * 0.5);
      const side = gaussian(hash2(i, 2), hash2(i, 3)) * (0.3 + peak * 0.15);
      const y = baseY + peak * (0.9 + L * 0.12) + mistLift;
      const z = zBase + side + gaussian(hash2(i, 4), hash2(i, 5)) * 0.4;

      const heightT = Math.min(1, Math.max(0, (y - baseY) / 2.4));
      // Teal body, gold on peaks / front layers
      const goldAmt = heightT * 0.65 + (1 - layerT) * 0.35 * heightT;
      const col = mixColor(0.18, 0.7, 0.72, 1.0, 0.84, 0.32, goldAmt);
      const dens = Math.exp(-mistLift * 1.5) * (0.55 + 0.45 * Math.exp(-Math.abs(side) * 2));
      const bright = (0.28 + dens * 0.5 + heightT * 0.25) * (0.75 + (1 - layerT) * 0.3);
      const sz = 0.14 + (1 - layerT) * 0.22 + dens * 0.15;
      setParticle(positions, colors, sizes, i, x, y, z, col[0] * bright, col[1] * bright, col[2] * bright, sz);
    }
  }
  return layout;
}
