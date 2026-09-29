/**
 * Bake image-sampled particle layouts WITH mode-specific 3D depth.
 * Includes original refs + Pinterest set.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const refsDir = path.join(root, 'public', 'refs');
const outDir = path.join(root, 'public', 'layouts');
fs.mkdirSync(outDir, { recursive: true });

const MAX_COUNT = Number(process.env.BAKE_MAX_COUNT || 280000);
const ONLY_MODE = process.env.MODE || '';
const SAMPLE_W = 960;

/** mode → { file (relative to public/refs), depthFamily, mask? } */
const MODE_REFS = {
  // Original five
  spiral: { file: 'c74056b61594f1544cc489c8006f62dc7693251e7c28f38652400feaa02a0951.jpeg', depth: 'swirl' },
  nebulaArm: { file: 'a02b09724d9d40a677f419e56c1e2b8ccd5e5cfafd91573a871dbc7531de84dc.jpeg', depth: 'nebula' },
  tunnel: { file: 'f5ef5dc53538cef20e92332afaf43c2992673a0e37151afc32c8bf20f6ef35f7.jpeg', depth: 'tunnel' },
  blackHole: { file: '061b80a4409b7989c6200cb738d5e480c21853a863d6baebddef7e77898e5eb6.jpeg', depth: 'blackHole' },
  emberStorm: { file: '9543807ffb4e1f7db6ead2eb64cf2a9e15955b6a5a5069e9cfee56f3b17a799b.jpeg', depth: 'cloud' },

  // Pinterest ten
  pinVortex: { file: 'pinterest/vortex-01.jpg', depth: 'swirl' },
  pinNebulaArm: { file: 'pinterest/nebula-arm-02.jpg', depth: 'nebula' },
  pinBlackHoleHalo: { file: 'pinterest/black-hole-03.jpg', depth: 'blackHole' },
  pinRadialNebula: { file: 'pinterest/radial-nebula-04.jpg', depth: 'radial' },
  pinStarTunnel: { file: 'pinterest/star-tunnel-05.png', depth: 'tunnel' },
  pinGalaxy: { file: 'pinterest/particle-galaxy-06.jpg', depth: 'galaxy' },
  pinBrightVortex: { file: 'pinterest/bright-vortex-07.jpg', depth: 'swirl' },
  pinAccretion: { file: 'pinterest/accretion-disk-08.jpg', depth: 'blackHole' },
  pinGranularBH: { file: 'pinterest/granular-blackhole-09.jpg', depth: 'blackHole' },
  pinSpiralGalaxy: { file: 'pinterest/spiral-galaxy-10.jpg', depth: 'galaxy', maskText: true },

  // Pinterest batch 2 (11–24)
  pinWormholeRing: { file: 'pinterest/wormhole-ring-11.jpg', depth: 'blackHole' },
  pinStarfield: { file: 'pinterest/starfield-particles-12.jpg', depth: 'cloud' },
  pinGranularLens: { file: 'pinterest/granular-lens-13.jpg', depth: 'blackHole' },
  pinBlackHoleArc: { file: 'pinterest/black-hole-arc-14.jpg', depth: 'blackHole' },
  pinGalaxyRings: { file: 'pinterest/galaxy-particle-rings-15.jpg', depth: 'galaxy' },
  pinStarDustGalaxy: { file: 'pinterest/star-dust-galaxy-16.jpg', depth: 'galaxy' },
  pinMonoVortex: { file: 'pinterest/monochrome-vortex-17.jpg', depth: 'swirl' },
  pinPixelSpiral: { file: 'pinterest/pixel-spiral-18.jpg', depth: 'galaxy' },
  pinDustField: { file: 'pinterest/particle-dust-field-19.jpg', depth: 'cloud' },
  pinStarDustTunnel: { file: 'pinterest/star-dust-tunnel-20.jpg', depth: 'tunnel' },
  pinWormholeParticle: { file: 'pinterest/wormhole-particle-ring-21.jpg', depth: 'blackHole' },
  pinBHFlow: { file: 'pinterest/black-hole-flow-22.jpg', depth: 'blackHole' },
  pinCosmicBurst: { file: 'pinterest/cosmic-burst-23.jpg', depth: 'radial' },
  pinParticleNetwork: { file: 'pinterest/particle-network-24.jpg', depth: 'cloud' },

  // Pinterest batch 3 (25–27) — pin.it Sep 29
  // Tall dark posters: aggressive bright bias + flat/mild depth so perspective
  // framing does not smear the front-view silhouette into a vague cloud.
  pinStardustPath: {
    file: 'pinterest/grey-space-wallpaper-25.jpg',
    depth: 'sheet',
    gamma: 1.9,
    thresh: 0.028,
    midKill: 0.6,
    brightBoost: 2.1,
    hotBoost: 1.7,
    darkBoost: 0.9,
    lowMul: 0.7,
    edgeBoost: 1.4,
    scatter: 0.28,
    depthScale: 0.55,
    sizeScale: 1.15,
    noCornerWatermark: true, // BR mask was cutting the path fringe
  },
  pinDarkVortex: {
    file: 'pinterest/dark-space-field-26.jpg',
    // Off-center glowing mouth + dark ridge: sheet preserves silhouette under perspective
    depth: 'sheet',
    gamma: 1.88,
    thresh: 0.026,
    midKill: 0.58,
    brightBoost: 2.15,
    hotBoost: 1.75,
    darkBoost: 0.85,
    lowMul: 0.65,
    edgeBoost: 1.55,
    scatter: 0.25,
    depthScale: 0.5,
    sizeScale: 1.12,
    noCornerWatermark: true,
  },
  pinParticleAbyss: {
    file: 'pinterest/astronomy-simulation-27.jpg',
    // Wave ridges + central bowl — mild tunnel (full tunnel warps XY under perspective)
    depth: 'tunnel',
    gamma: 1.95,
    thresh: 0.025,
    midKill: 0.55,
    brightBoost: 1.95,
    hotBoost: 1.55,
    darkBoost: 0.8,
    lowMul: 0.62,
    edgeBoost: 2.2,
    scatter: 0.28,
    depthScale: 0.36,
    tunnelCx: 0.5,
    tunnelCy: 0.46,
    sizeScale: 1.12,
    maskBottom: 0.915, // CREATED BY DOGAN URAL watermark
    noCornerWatermark: true,
    colorful: true, // keep amber cores in the bowl
  },

  // NASA Image Library (public domain) — colorful RGB preserved
  nasaPillars: { file: 'nasa/pillars-of-creation.jpg', depth: 'cloud', colorful: true },
  nasaCrab: { file: 'nasa/crab-nebula.jpg', depth: 'swirl', colorful: true },
  nasaCarina: { file: 'nasa/carina-cosmic-cliffs.jpg', depth: 'nebula', colorful: true },
  nasaAndromeda: { file: 'nasa/andromeda.jpg', depth: 'galaxy', colorful: true },
  nasaWhirlpool: { file: 'nasa/whirlpool-galaxy.jpg', depth: 'galaxy', colorful: true },
  nasaSombrero: { file: 'nasa/sombrero-galaxy.jpg', depth: 'galaxy', colorful: true },
  nasaHelix: { file: 'nasa/helix-nebula.jpg', depth: 'radial', colorful: true },
  nasaBHSim: { file: 'nasa/black-hole-sim.jpg', depth: 'blackHole', colorful: true },
  nasaMWCenter: { file: 'nasa/milky-way-center.jpg', depth: 'galaxy', colorful: true },
  nasaEagle: { file: 'nasa/eagle-nebula.jpg', depth: 'cloud', colorful: true },
  nasaOrion: { file: 'nasa/orion-nebula.jpg', depth: 'cloud', colorful: true },
  nasaBehemoth: { file: 'nasa/behemoth-black-hole.jpg', depth: 'blackHole', colorful: true },

  // Rotating weekly featured NASA image (updated by scripts/weekly-nasa.mjs)
  nasaWeekly: { file: 'nasa/weekly-latest.jpg', depth: 'cloud', colorful: true },
};




function hash(i) {
  let x = Math.imul(i ^ 0x27d4eb2d, 0x165667b1);
  x = Math.imul(x ^ (x >>> 15), 0x27d4eb2d);
  x = Math.imul(x ^ (x >>> 13), 0x165667b1);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
function hash2(i, s) {
  return hash(i * 374761393 + s * 668265263);
}

function lumAt(data, w, h, x, y) {
  x = Math.max(0, Math.min(w - 1, x | 0));
  y = Math.max(0, Math.min(h - 1, y | 0));
  const i = (y * w + x) * 4;
  return 0.2126 * (data[i] / 255) + 0.7152 * (data[i + 1] / 255) + 0.0722 * (data[i + 2] / 255);
}

function edgeAt(data, w, h, x, y) {
  const l = (dx, dy) => lumAt(data, w, h, x + dx, y + dy);
  const gx = -l(-1, -1) + l(1, -1) - 2 * l(-1, 0) + 2 * l(1, 0) - l(-1, 1) + l(1, 1);
  const gy = -l(-1, -1) - 2 * l(0, -1) - l(1, -1) + l(-1, 1) + 2 * l(0, 1) + l(1, 1);
  return Math.min(1, Math.sqrt(gx * gx + gy * gy) * 2.2);
}

/** Extra mask for BELIEVE / watermark text on spiral-galaxy-10 */
function textMaskWeight(u, v, lum, edge) {
  let m = 1;
  // BELIEVE sits in upper third across the vertical beam (beam ≈ u=0.5)
  if (v > 0.10 && v < 0.40) {
    const distC = Math.abs(u - 0.5);
    // Kill letter glyphs left/right of the central beam
    if (distC > 0.035 && lum > 0.28) m *= 0.015;
    if (distC > 0.02 && lum > 0.5 && edge > 0.18) m *= 0.04;
    // Soften mid-beam letter junctions (B/E crossbars intersecting beam)
    if (distC < 0.06 && lum > 0.6 && edge > 0.35 && (v > 0.14 && v < 0.36)) m *= 0.35;
  }
  // Bottom credit / URL watermark
  if (v > 0.88) m *= 0.0;
  if (v > 0.82 && v < 0.92 && Math.abs(u - 0.5) < 0.35 && lum > 0.25) m *= 0.05;
  return m;
}

function depthForFamily(depth, u, v, x, y, lum, edge, layer, p, cfg = {}) {
  const n1 = hash2(p, 10) - 0.5;
  const n2 = hash2(p, 11) - 0.5;
  const cx = x;
  const cy = y;
  const scatter = cfg.scatter ?? 1;
  const depthScale = cfg.depthScale ?? 1;

  switch (depth) {
    case 'sheet': {
      // Near-planar poster depth — preserves front silhouette under perspective FOV
      const layerZ = (layer - 1) * 0.22;
      return (layerZ + (lum - 0.35) * 0.55 + n1 * 0.12 * scatter + edge * 0.15 * n2) * depthScale;
    }
    case 'swirl': {
      const ang = Math.atan2(cy + 2.5, cx);
      const rad = Math.hypot(cx, cy + 2.5);
      const ridge = Math.sin(ang * 4 - rad * 0.55) * 0.5 + 0.5;
      const layerZ = (layer - 1) * 1.85;
      const ribbonThick = (n1 * 0.85 + (ridge - 0.5) * 1.2) * (0.7 + lum);
      return (layerZ + ribbonThick + (lum - 0.3) * 1.3 + edge * 0.55 * n2) * depthScale * (0.55 + 0.45 * scatter);
    }
    case 'nebula': {
      const ground = v > 0.78;
      if (ground) return ((layer - 1) * 0.15 + n1 * 0.08) * depthScale;
      const rise = 1 - v;
      const layerZ = (layer - 1) * (1.1 + rise * 1.4);
      const armThick = n1 * (0.75 + lum * 1.0) + edge * 0.55 * n2;
      return (layerZ + armThick + (lum - 0.25) * 1.0) * depthScale;
    }
    case 'tunnel': {
      const tcx = cfg.tunnelCx ?? 0.5;
      const tcy = cfg.tunnelCy ?? 0.48;
      const dx = (u - tcx) * 2;
      const dy = (v - tcy) * 2;
      const rho = Math.min(1.35, Math.hypot(dx, dy));
      const into = -(1.2 - rho) * (1.2 - rho) * 7.5;
      const wall = (layer - 1) * 1.35;
      const dune = Math.sin(Math.atan2(dy, dx) * 3 + rho * 8) * 0.55 * (0.4 + lum);
      return (into + wall + dune + n1 * 0.35 * scatter + (lum - 0.2) * 0.7) * depthScale;
    }
    case 'blackHole': {
      const dx = (u - 0.5) * 2;
      const dy = (v - 0.5) * 2;
      const rho = Math.hypot(dx, dy);
      const voidR = 0.22;
      const isStar = lum < 0.12 && rho > 0.55;
      if (isStar) {
        return -2.8 + n1 * 0.4;
      }
      const nearRing = Math.abs(rho - voidR * 1.35) < 0.12 && lum > 0.25;
      if (nearRing || (edge > 0.35 && rho < 0.45)) {
        const sphereR = 3.0 + (layer - 1) * 0.55;
        const rr = Math.min(sphereR * 0.95, Math.hypot(cx, cy));
        const zz = Math.sqrt(Math.max(0, sphereR * sphereR - rr * rr));
        return (dy < 0 ? -1 : 1) * zz * 0.85 + (layer - 1) * 0.4 + n1 * 0.2;
      }
      const tilt = (58 * Math.PI) / 180;
      const zLocal = (layer - 1) * 0.28 + n1 * 0.15;
      const diskZ = cy * Math.sin(tilt) * 0.85 + zLocal * Math.cos(tilt);
      return diskZ + (lum - 0.3) * 0.7 + edge * 0.35 * n2;
    }
    case 'radial': {
      // Concentric shells — brighter rings closer / layered
      const dx = (u - 0.5) * 2;
      const dy = (v - 0.5) * 2;
      const rho = Math.hypot(dx, dy);
      const shell = (layer - 1) * 1.6;
      const radialPush = (0.85 - rho) * lum * 1.4;
      return shell + radialPush + n1 * 0.45 + edge * 0.4 * n2 + (lum - 0.3) * 0.9;
    }
    case 'galaxy': {
      // Galactic disk: thin Z with spiral arm thickness; bulge thicker at center
      const dx = (u - 0.5) * 2;
      const dy = (v - 0.5) * 2;
      const rho = Math.hypot(dx, dy);
      const bulge = Math.exp(-rho * rho * 4) * (1.2 + lum);
      const armWave = Math.sin(Math.atan2(dy, dx) * 2 - rho * 6) * 0.35 * lum;
      const diskThin = (layer - 1) * 0.55 + n1 * 0.25;
      return diskThin + bulge * 0.9 + armWave + (lum - 0.25) * 0.8 + edge * 0.3 * n2;
    }
    case 'cloud':
    default: {
      const layerZ = (layer - 1) * 2.0;
      return (layerZ + (lum - 0.3) * 1.6 + edge * 0.7 * n1 + n2 * 0.5 * scatter) * depthScale;
    }
  }
}

async function bakeFromImage(mode, cfg, count = MAX_COUNT) {
  const src = path.join(refsDir, cfg.file);
  if (!fs.existsSync(src)) throw new Error(`Missing ref ${src}`);
  const meta = await sharp(src).metadata();
  const aspect = meta.height / meta.width;
  const w = SAMPLE_W;
  const h = Math.round(SAMPLE_W * aspect);

  const { data } = await sharp(src)
    .resize(w, h, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const wmX0 = Math.floor(w * 0.72);
  const wmY0 = Math.floor(h * 0.88);
  const weights = new Float64Array(w * h);
  let total = 0;
  const gamma = cfg.gamma ?? (cfg.colorful ? 1.35 : 1.55); // colorful: keep midtone hues
  const thresh = cfg.thresh ?? 0;
  const midKill = cfg.midKill ?? 1;
  const brightBoost = cfg.brightBoost ?? 1.55;
  const hotBoost = cfg.hotBoost ?? 1.35;
  const darkBoost = cfg.darkBoost ?? 1.15;
  const lowMul = cfg.lowMul ?? 1;
  const edgeBoost = cfg.edgeBoost ?? 1;
  const maskBottom = cfg.maskBottom ?? 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      let wgt = 0;
      if (lum >= thresh) {
        wgt = Math.pow(Math.max(lum, 0.004), gamma);
        // Keep a little starfield, but favor bright structure
        if (lum > 0.02 && lum < 0.12) wgt *= darkBoost;
        if (lum >= 0.12 && lum < 0.4) wgt *= midKill;
        if (lum < 0.25) wgt *= lowMul;
        if (lum > 0.45) wgt *= brightBoost;
        if (lum > 0.7) wgt *= hotBoost;
        if (edgeBoost !== 1) {
          const edge = edgeAt(data, w, h, x, y);
          wgt *= 1 + (edgeBoost - 1) * edge;
        }
      }
      if (!cfg.noCornerWatermark && x >= wmX0 && y >= wmY0) wgt = 0;
      if (maskBottom > 0 && (y + 0.5) / h > maskBottom) wgt = 0;

      if (cfg.maskText) {
        const u = (x + 0.5) / w;
        const v = (y + 0.5) / h;
        const edge = edgeAt(data, w, h, x, y);
        wgt *= textMaskWeight(u, v, lum, edge);
        // Also hard-mask bottom caption strip common on posters
        if (v > 0.92) wgt = 0;
      }

      weights[y * w + x] = wgt;
      total += wgt;
    }
  }

  if (total <= 0) throw new Error(`Zero weight for ${mode}`);

  const cdf = new Float64Array(w * h);
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    cdf[i] = acc / total;
  }

  function samplePixel(u) {
    let lo = 0, hi = cdf.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] < u) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  // Landscape images (e.g. pinGalaxy) use wider plane
  const planeW = aspect < 1 ? 14.0 : 9.0;
  const planeH = planeW * aspect;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const depth = cfg.depth;

  for (let p = 0; p < count; p++) {
    const layer = p % 3;
    const pix = samplePixel(hash(p + 17 + layer * 91));
    const px = pix % w;
    const py = (pix / w) | 0;
    const jx = hash2(p, 1) - 0.5;
    const jy = hash2(p, 2) - 0.5;
    const u = (px + 0.5 + jx) / w;
    const v = (py + 0.5 + jy) / h;

    const i = (py * w + px) * 4;
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const edge = edgeAt(data, w, h, px, py);

    // Colorful NASA: preserve hue; mono pins: stronger white cores
    if (cfg.colorful) {
      const satBoost = 1.05 + lum * 0.55;
      r = Math.min(1, r * satBoost);
      g = Math.min(1, g * satBoost);
      b = Math.min(1, b * satBoost);
      // gentle lift so additive still reads, without bleaching to white
      const lift = 0.08 * lum;
      r = Math.min(1, r + lift);
      g = Math.min(1, g + lift);
      b = Math.min(1, b + lift);
    } else {
      const boost = 0.85 + lum * 1.25;
      r = Math.min(1, r * boost);
      g = Math.min(1, g * boost);
      b = Math.min(1, b * boost);
    }

    let x = (u - 0.5) * planeW;
    let y = (0.5 - v) * planeH;
    let z = depthForFamily(depth, u, v, x, y, lum, edge, layer, p, cfg);

    if (depth === 'blackHole' && lum < 0.12) {
      const R = 8 + hash2(p, 22) * 7;
      const th = hash2(p, 23) * Math.PI * 2;
      const ph = Math.acos(2 * hash2(p, 24) - 1);
      if (hash2(p, 25) > 0.55) {
        x = R * Math.sin(ph) * Math.cos(th);
        y = R * Math.sin(ph) * Math.sin(th);
        z = R * Math.cos(ph) - 2;
      }
    }

    positions[p * 3] = x;
    positions[p * 3 + 1] = y;
    positions[p * 3 + 2] = z;
    colors[p * 3] = r;
    colors[p * 3 + 1] = g;
    colors[p * 3 + 2] = b;
    const layerBoost = layer === 0 ? 1.1 : layer === 2 ? 0.88 : 1.0;
    // Tiny size variance — soft accumulation feel, still sharp dots
    const sizeJitter = 0.12 + hash2(p, 4) * 0.14;
    const sizeScale = cfg.sizeScale ?? 1;
    sizes[p] = (0.2 + lum * 0.5 + sizeJitter) * layerBoost * sizeScale;
  }

  const header = Buffer.alloc(4);
  header.writeUInt32LE(count, 0);
  const out = path.join(outDir, `${mode}.bin`);
  fs.writeFileSync(
    out,
    Buffer.concat([
      header,
      Buffer.from(positions.buffer),
      Buffer.from(colors.buffer),
      Buffer.from(sizes.buffer),
    ]),
  );
  console.log(`baked ${mode}: ${count} [${depth}] ← ${cfg.file}`);

  const metaOut = {
    mode,
    planeW,
    planeH,
    aspect,
    count,
    source: cfg.file,
    depth: `mode-3d-${depth}`,
  };
  fs.writeFileSync(path.join(outDir, `${mode}.json`), JSON.stringify(metaOut, null, 2));
  return metaOut;
}

const indexPath = path.join(outDir, 'index.json');
let metas = {};
if (ONLY_MODE && fs.existsSync(indexPath)) {
  try { metas = JSON.parse(fs.readFileSync(indexPath, 'utf8')); } catch { metas = {}; }
}

const entries = Object.entries(MODE_REFS).filter(([mode]) => !ONLY_MODE || mode === ONLY_MODE);
if (ONLY_MODE && entries.length === 0) {
  console.error(`Unknown MODE=${ONLY_MODE}. Known:`, Object.keys(MODE_REFS).join(', '));
  process.exit(1);
}

for (const [mode, cfg] of entries) {
  if (!fs.existsSync(path.join(refsDir, cfg.file))) {
    console.warn(`skip ${mode}: missing ${cfg.file}`);
    continue;
  }
  metas[mode] = await bakeFromImage(mode, cfg, MAX_COUNT);
}
fs.writeFileSync(indexPath, JSON.stringify(metas, null, 2));
console.log('done', Object.keys(metas).length, 'layouts', ONLY_MODE ? `(only ${ONLY_MODE})` : '', `count=${MAX_COUNT}`);
