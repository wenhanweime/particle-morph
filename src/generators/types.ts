export type ModeId =
  | 'spiral'
  | 'nebulaArm'
  | 'tunnel'
  | 'blackHole'
  | 'splash'
  | 'radialAura'
  | 'mistMountains'
  | 'emberStorm'
  | 'pinVortex'
  | 'pinNebulaArm'
  | 'pinBlackHoleHalo'
  | 'pinRadialNebula'
  | 'pinStarTunnel'
  | 'pinGalaxy'
  | 'pinBrightVortex'
  | 'pinAccretion'
  | 'pinGranularBH'
  | 'pinSpiralGalaxy'
  | 'pinWormholeRing'
  | 'pinStarfield'
  | 'pinGranularLens'
  | 'pinBlackHoleArc'
  | 'pinGalaxyRings'
  | 'pinStarDustGalaxy'
  | 'pinMonoVortex'
  | 'pinPixelSpiral'
  | 'pinDustField'
  | 'pinStarDustTunnel'
  | 'pinWormholeParticle'
  | 'pinBHFlow'
  | 'pinCosmicBurst'
  | 'pinParticleNetwork'
  | 'pinStardustPath'
  | 'pinDarkVortex'
  | 'pinParticleAbyss'
  | 'nasaPillars'
  | 'nasaCrab'
  | 'nasaCarina'
  | 'nasaAndromeda'
  | 'nasaWhirlpool'
  | 'nasaSombrero'
  | 'nasaHelix'
  | 'nasaBHSim'
  | 'nasaMWCenter'
  | 'nasaEagle'
  | 'nasaOrion'
  | 'nasaBehemoth'
  | 'nasaWeekly';

export interface ModeInfo {
  id: ModeId;
  label: string;
  key: string;
  group?: string;
}

export const MODES: ModeInfo[] = [
  { id: 'pinDarkVortex', label: '暗域漩涡', key: 'z', group: 'Pinterest C' },
  { id: 'pinStardustPath', label: '星尘之路', key: 'y', group: 'Pinterest C' },
  { id: 'pinParticleAbyss', label: '星尘深渊', key: '9', group: 'Pinterest C' },

  { id: 'spiral', label: '螺旋漩涡', key: '1', group: '经典' },
  { id: 'nebulaArm', label: '星云臂', key: '2', group: '经典' },
  { id: 'tunnel', label: '隧道深渊', key: '3', group: '经典' },
  { id: 'blackHole', label: '黑洞吸积', key: '4', group: '经典' },
  { id: 'splash', label: '粒子飞溅', key: '5', group: '经典' },
  { id: 'radialAura', label: '径向光晕', key: '6', group: '经典' },
  { id: 'mistMountains', label: '雾山', key: '7', group: '经典' },
  { id: 'emberStorm', label: '余烬风暴', key: '8', group: '经典' },

  { id: 'pinVortex', label: '粒子漩涡', key: 'a', group: 'Pinterest A' },
  { id: 'pinNebulaArm', label: '星云旋臂', key: 'b', group: 'Pinterest A' },
  { id: 'pinBlackHoleHalo', label: '黑洞粒子晕', key: 'c', group: 'Pinterest A' },
  { id: 'pinRadialNebula', label: '径向星云', key: 'd', group: 'Pinterest A' },
  { id: 'pinStarTunnel', label: '恒星隧道', key: 'e', group: 'Pinterest A' },
  { id: 'pinGalaxy', label: '粒子星系', key: 'f', group: 'Pinterest A' },
  { id: 'pinBrightVortex', label: '亮星漩涡', key: 'g', group: 'Pinterest A' },
  { id: 'pinAccretion', label: '黑洞吸积盘', key: 'h', group: 'Pinterest A' },
  { id: 'pinGranularBH', label: '颗粒黑洞', key: 'i', group: 'Pinterest A' },
  { id: 'pinSpiralGalaxy', label: '单色螺旋星系', key: 'j', group: 'Pinterest A' },

  { id: 'pinWormholeRing', label: '黑洞粒子环', key: 'k', group: 'Pinterest B' },
  { id: 'pinStarfield', label: '单色星尘场', key: 'l', group: 'Pinterest B' },
  { id: 'pinGranularLens', label: '颗粒引力透镜', key: 'm', group: 'Pinterest B' },
  { id: 'pinBlackHoleArc', label: '弧面黑洞', key: 'n', group: 'Pinterest B' },
  { id: 'pinGalaxyRings', label: '粒子星系环', key: 'o', group: 'Pinterest B' },
  { id: 'pinStarDustGalaxy', label: '星尘旋涡星系', key: 'p', group: 'Pinterest B' },
  { id: 'pinMonoVortex', label: '单色星尘漩涡', key: 'q', group: 'Pinterest B' },
  { id: 'pinPixelSpiral', label: '像素螺旋星系', key: 'r', group: 'Pinterest B' },
  { id: 'pinDustField', label: '颗粒尘埃场', key: 's', group: 'Pinterest B' },
  { id: 'pinStarDustTunnel', label: '星尘隧道', key: 't', group: 'Pinterest B' },
  { id: 'pinWormholeParticle', label: '粒子虫洞环', key: 'u', group: 'Pinterest B' },
  { id: 'pinBHFlow', label: '黑洞粒子流', key: 'v', group: 'Pinterest B' },
  { id: 'pinCosmicBurst', label: '宇宙粒子爆发', key: 'w', group: 'Pinterest B' },
  { id: 'pinParticleNetwork', label: '粒子宇宙网络', key: 'x', group: 'Pinterest B' },
  { id: 'nasaPillars', label: '创生之柱', key: 'A', group: 'NASA' },
  { id: 'nasaCrab', label: '蟹状星云', key: 'B', group: 'NASA' },
  { id: 'nasaCarina', label: '船底座宇宙悬崖', key: 'C', group: 'NASA' },
  { id: 'nasaAndromeda', label: '仙女座星系', key: 'D', group: 'NASA' },
  { id: 'nasaWhirlpool', label: '涡状星系', key: 'E', group: 'NASA' },
  { id: 'nasaSombrero', label: '草帽星系', key: 'F', group: 'NASA' },
  { id: 'nasaHelix', label: '螺旋星云', key: 'G', group: 'NASA' },
  { id: 'nasaBHSim', label: '黑洞模拟', key: 'H', group: 'NASA' },
  { id: 'nasaMWCenter', label: '银河中心', key: 'I', group: 'NASA' },
  { id: 'nasaEagle', label: '鹰状星云', key: 'J', group: 'NASA' },
  { id: 'nasaOrion', label: '猎户座星云', key: 'K', group: 'NASA' },
  { id: 'nasaBehemoth', label: '巨兽黑洞', key: 'L', group: 'NASA' },
  { id: 'nasaWeekly', label: '本周 NASA', key: 'W', group: 'NASA' },
];

export interface ParticleLayout {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
}

export type QualityLevel = 'low' | 'med' | 'high';

export const QUALITY_COUNTS: Record<QualityLevel, number> = {
  low: 140000,
  med: 220000,
  high: 280000,
};

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  bloom: [number, number, number];
  spinY: number;
  voidRadius?: number;
}
