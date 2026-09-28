import type { CameraPreset, ModeId } from './types';

const IMAGE_FRAME: CameraPreset = {
  position: [0, 0, 22],
  target: [0, 0, 0],
  fov: 56,
  bloom: [0.085, 0.22, 0.88],
  spinY: 0,
};

const BH_FRAME: CameraPreset = {
  ...IMAGE_FRAME,
  fov: 54,
  bloom: [0, 0.1, 1],
  spinY: 0,
  voidRadius: 0,
};

export const CAMERA_PRESETS: Record<ModeId, CameraPreset> = {
  spiral: { ...IMAGE_FRAME, bloom: [0.08, 0.2, 0.88], spinY: 0.006 },
  nebulaArm: { ...IMAGE_FRAME },
  tunnel: { ...IMAGE_FRAME, bloom: [0.07, 0.2, 0.9] },
  blackHole: { ...BH_FRAME, spinY: 0.005 },
  splash: {
    position: [0.5, 3.0, 13],
    target: [0, 2.0, 0],
    fov: 50,
    bloom: [0.08, 0.22, 0.9],
    spinY: 0.015,
  },
  radialAura: {
    position: [0, 0.6, 15],
    target: [0, 0, 0],
    fov: 38,
    bloom: [0.12, 0.26, 0.88],
    spinY: 0.02,
  },
  mistMountains: {
    position: [0, 2.8, 13.5],
    target: [0, 0.2, -1.5],
    fov: 46,
    bloom: [0.07, 0.22, 0.9],
    spinY: 0,
  },
  emberStorm: { ...IMAGE_FRAME, bloom: [0.09, 0.22, 0.87], spinY: 0.008 },

  pinVortex: { ...IMAGE_FRAME },
  pinNebulaArm: { ...IMAGE_FRAME },
  pinBlackHoleHalo: { ...BH_FRAME },
  pinRadialNebula: { ...IMAGE_FRAME },
  pinStarTunnel: { ...IMAGE_FRAME, bloom: [0.07, 0.2, 0.9] },
  pinGalaxy: { ...IMAGE_FRAME },
  pinBrightVortex: { ...IMAGE_FRAME, bloom: [0.09, 0.22, 0.86] },
  pinAccretion: { ...BH_FRAME },
  pinGranularBH: { ...BH_FRAME },
  pinSpiralGalaxy: { ...IMAGE_FRAME },

  pinWormholeRing: { ...BH_FRAME },
  pinStarfield: { ...IMAGE_FRAME, bloom: [0.06, 0.18, 0.92] },
  pinGranularLens: { ...BH_FRAME },
  pinBlackHoleArc: { ...BH_FRAME },
  pinGalaxyRings: { ...IMAGE_FRAME },
  pinStarDustGalaxy: { ...IMAGE_FRAME },
  pinMonoVortex: { ...IMAGE_FRAME },
  pinPixelSpiral: { ...IMAGE_FRAME },
  pinDustField: { ...IMAGE_FRAME, bloom: [0.06, 0.18, 0.92] },
  pinStarDustTunnel: { ...IMAGE_FRAME, bloom: [0.07, 0.2, 0.9] },
  pinWormholeParticle: { ...BH_FRAME },
  pinBHFlow: { ...BH_FRAME },
  pinCosmicBurst: { ...IMAGE_FRAME, bloom: [0.1, 0.24, 0.85] },
  pinParticleNetwork: { ...IMAGE_FRAME, bloom: [0.06, 0.18, 0.92] },

  pinStardustPath: { ...IMAGE_FRAME, bloom: [0.08, 0.22, 0.88] },
  pinDarkVortex: { ...IMAGE_FRAME, bloom: [0.09, 0.24, 0.86] },
  pinParticleAbyss: { ...IMAGE_FRAME, bloom: [0.1, 0.24, 0.85] },

  // NASA — mild bloom for colorful nebulae; BH stays dark
  nasaPillars: { ...IMAGE_FRAME, bloom: [0.12, 0.28, 0.82] },
  nasaCrab: { ...IMAGE_FRAME, bloom: [0.12, 0.28, 0.82] },
  nasaCarina: { ...IMAGE_FRAME, bloom: [0.14, 0.3, 0.8] },
  nasaAndromeda: { ...IMAGE_FRAME, bloom: [0.1, 0.24, 0.86] },
  nasaWhirlpool: { ...IMAGE_FRAME, bloom: [0.1, 0.24, 0.86] },
  nasaSombrero: { ...IMAGE_FRAME, bloom: [0.1, 0.24, 0.86] },
  nasaHelix: { ...IMAGE_FRAME, bloom: [0.11, 0.26, 0.84] },
  nasaBHSim: { ...BH_FRAME },
  nasaMWCenter: { ...IMAGE_FRAME, bloom: [0.12, 0.28, 0.82] },
  nasaEagle: { ...IMAGE_FRAME, bloom: [0.12, 0.28, 0.82] },
  nasaOrion: { ...IMAGE_FRAME, bloom: [0.13, 0.28, 0.8] },
  nasaBehemoth: { ...BH_FRAME },
  nasaWeekly: { ...IMAGE_FRAME, bloom: [0.12, 0.28, 0.82] },
};

