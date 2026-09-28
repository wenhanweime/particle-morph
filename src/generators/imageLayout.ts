import type { ModeId, ParticleLayout } from './types';
import { createEmptyLayout } from './helpers';

export interface LayoutMeta {
  mode: string;
  planeW: number;
  planeH: number;
  aspect: number;
  count: number;
  source: string;
}

const IMAGE_MODES = new Set<ModeId>([
  'spiral',
  'nebulaArm',
  'tunnel',
  'blackHole',
  'emberStorm',
  'pinVortex',
  'pinNebulaArm',
  'pinBlackHoleHalo',
  'pinRadialNebula',
  'pinStarTunnel',
  'pinGalaxy',
  'pinBrightVortex',
  'pinAccretion',
  'pinGranularBH',
  'pinSpiralGalaxy',
  'pinWormholeRing',
  'pinStarfield',
  'pinGranularLens',
  'pinBlackHoleArc',
  'pinGalaxyRings',
  'pinStarDustGalaxy',
  'pinMonoVortex',
  'pinPixelSpiral',
  'pinDustField',
  'pinStarDustTunnel',
  'pinWormholeParticle',
  'pinBHFlow',
  'pinCosmicBurst',
  'pinParticleNetwork',
  'nasaPillars',
  'nasaCrab',
  'nasaCarina',
  'nasaAndromeda',
  'nasaWhirlpool',
  'nasaSombrero',
  'nasaHelix',
  'nasaBHSim',
  'nasaMWCenter',
  'nasaEagle',
  'nasaOrion',
  'nasaBehemoth',
  'nasaWeekly',
]);

export function isImageMode(mode: ModeId): boolean {
  return IMAGE_MODES.has(mode);
}

type Packed = {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  meta: LayoutMeta;
  maxCount: number;
};

const cache = new Map<ModeId, Packed>();
let indexMeta: Record<string, LayoutMeta> | null = null;

function parseBin(buf: ArrayBuffer): { count: number; positions: Float32Array; colors: Float32Array; sizes: Float32Array } {
  const view = new DataView(buf);
  const count = view.getUint32(0, true);
  const header = 4;
  const posBytes = count * 3 * 4;
  const colBytes = count * 3 * 4;
  const positions = new Float32Array(buf, header, count * 3);
  const colors = new Float32Array(buf, header + posBytes, count * 3);
  const sizes = new Float32Array(buf, header + posBytes + colBytes, count);
  // Copy out so we own the buffers (views are tied to ArrayBuffer slices)
  return {
    count,
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    sizes: new Float32Array(sizes),
  };
}

export async function preloadImageLayouts(): Promise<void> {
  const base = import.meta.env.BASE_URL;
  const indexRes = await fetch(`${base}layouts/index.json`);
  indexMeta = await indexRes.json();

  await Promise.all(
    [...IMAGE_MODES].map(async (mode) => {
      const [binRes, meta] = await Promise.all([
        fetch(`${base}layouts/${mode}.bin`),
        Promise.resolve(indexMeta![mode]),
      ]);
      if (!binRes.ok) throw new Error(`Failed to load layout ${mode}`);
      const buf = await binRes.arrayBuffer();
      const parsed = parseBin(buf);
      cache.set(mode, {
        positions: parsed.positions,
        colors: parsed.colors,
        sizes: parsed.sizes,
        meta: meta ?? {
          mode,
          planeW: 9,
          planeH: 9 * (2868 / 1320),
          aspect: 2868 / 1320,
          count: parsed.count,
          source: '',
        },
        maxCount: parsed.count,
      });
    }),
  );
}

/** Take first `count` samples from baked layout (deterministic subset). */
export function layoutFromImage(mode: ModeId, count: number): ParticleLayout {
  const packed = cache.get(mode);
  if (!packed) {
    // Fallback empty if not preloaded
    return createEmptyLayout(count);
  }
  const n = Math.min(count, packed.maxCount);
  const layout = createEmptyLayout(count);
  layout.positions.set(packed.positions.subarray(0, n * 3));
  layout.colors.set(packed.colors.subarray(0, n * 3));
  layout.sizes.set(packed.sizes.subarray(0, n));

  // If requesting more than baked (shouldn't), duplicate with jitter
  if (count > n) {
    for (let i = n; i < count; i++) {
      const src = i % n;
      const j = i * 3;
      const s = src * 3;
      layout.positions[j] = packed.positions[s] + (Math.random() - 0.5) * 0.05;
      layout.positions[j + 1] = packed.positions[s + 1] + (Math.random() - 0.5) * 0.05;
      layout.positions[j + 2] = packed.positions[s + 2];
      layout.colors[j] = packed.colors[s];
      layout.colors[j + 1] = packed.colors[s + 1];
      layout.colors[j + 2] = packed.colors[s + 2];
      layout.sizes[i] = packed.sizes[src];
    }
  }
  return layout;
}

export function getLayoutMeta(mode: ModeId): LayoutMeta | null {
  return cache.get(mode)?.meta ?? indexMeta?.[mode] ?? null;
}
