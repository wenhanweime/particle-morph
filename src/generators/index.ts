import { generateSpiral } from './spiral';
import { generateNebulaArm } from './nebulaArm';
import { generateTunnel } from './tunnel';
import { generateBlackHole } from './blackHole';
import { generateSplash } from './splash';
import { generateRadialAura } from './radialAura';
import { generateMistMountains } from './mistMountains';
import { generateEmberStorm } from './emberStorm';
import { isImageMode, layoutFromImage } from './imageLayout';
import type { ModeId, ParticleLayout } from './types';

export * from './types';
export { CAMERA_PRESETS } from './cameraPresets';
export { easeInOutCubic } from './helpers';
export {
  preloadImageLayouts,
  isImageMode,
  getLayoutMeta,
} from './imageLayout';

const PROCEDURAL: Partial<Record<ModeId, (count: number) => ParticleLayout>> = {
  spiral: generateSpiral,
  nebulaArm: generateNebulaArm,
  tunnel: generateTunnel,
  blackHole: generateBlackHole,
  splash: generateSplash,
  radialAura: generateRadialAura,
  mistMountains: generateMistMountains,
  emberStorm: generateEmberStorm,
};

export function generateLayout(mode: ModeId, count: number): ParticleLayout {
  if (isImageMode(mode)) {
    return layoutFromImage(mode, count);
  }
  const fn = PROCEDURAL[mode];
  if (!fn) throw new Error(`No generator for mode ${mode}`);
  return fn(count);
}
