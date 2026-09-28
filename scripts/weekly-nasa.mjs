/**
 * Weekly NASA featured image → nasaWeekly morph mode.
 *
 * Fetches 1 image from images-api.nasa.gov (rotating queries by ISO week),
 * saves public/refs/nasa/weekly-latest.jpg, appends/updates nasa/manifest.json,
 * re-bakes MODE=nasaWeekly, prints slug/label.
 *
 * Usage:
 *   node scripts/weekly-nasa.mjs
 *   npm run weekly-nasa
 *   FORCE=1 node scripts/weekly-nasa.mjs          # ignore same-week skip
 *   NASA_API_KEY=... node scripts/weekly-nasa.mjs # optional
 *
 * Cron / GitHub Actions (example):
 *   0 8 * * 1  cd /path/to/particle-morph && npm run weekly-nasa && git add public/refs/nasa && git commit -m "chore: weekly NASA" && git push
 *   (Then Vercel rebuilds, or run `npm run build` locally.)
 *
 * Idempotent: if weekly-state.json already has this ISO week (and FORCE≠1), exits 0 without re-fetch.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { createHash } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const nasaDir = path.join(root, 'public', 'refs', 'nasa');
const manifestPath = path.join(nasaDir, 'manifest.json');
const statePath = path.join(nasaDir, 'weekly-state.json');
const outImage = path.join(nasaDir, 'weekly-latest.jpg');

const QUERIES = [
  'nebula',
  'galaxy',
  'black hole',
  'JWST',
  'Hubble pillars',
  'supernova remnant',
  'spiral galaxy',
  'star formation',
  'cosmic dust',
  'orion nebula',
  'milky way',
  'planetary nebula',
];

function isoWeek(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week, key: `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}` };
}

function pickQuery(weekKey) {
  const h = createHash('sha1').update(weekKey).digest();
  return QUERIES[h[0] % QUERIES.length];
}

async function searchNasa(query) {
  const key = process.env.NASA_API_KEY;
  const url = new URL('https://images-api.nasa.gov/search');
  url.searchParams.set('q', query);
  url.searchParams.set('media_type', 'image');
  url.searchParams.set('page', '1');
  url.searchParams.set('page_size', '20');
  // images-api does not require api.nasa.gov key; keep optional header unused
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NASA search HTTP ${res.status}`);
  const data = await res.json();
  const items = data?.collection?.items || [];
  if (!items.length) throw new Error(`No results for q=${query}`);
  // Prefer items with nasa_id and large-ish images
  return items;
}

async function resolveImageUrl(item) {
  const href = item?.href;
  const meta = item?.data?.[0] || {};
  if (!href) throw new Error('item missing href');
  const collRes = await fetch(href);
  if (!collRes.ok) throw new Error(`asset collection HTTP ${collRes.status}`);
  const assets = await collRes.json();
  // Prefer ~large.jpg / ~medium, avoid thumb / metadata
  const ranked = [...assets].sort((a, b) => {
    const score = (u) => {
      const s = String(u).toLowerCase();
      if (s.includes('~orig')) return 5;
      if (s.includes('~large')) return 4;
      if (s.includes('~medium')) return 3;
      if (s.includes('~small')) return 1;
      if (s.includes('thumb')) return 0;
      if (s.endsWith('.jpg') || s.endsWith('.jpeg') || s.endsWith('.png')) return 2;
      return 0;
    };
    return score(b) - score(a);
  });
  const best = ranked.find((u) => /\.(jpe?g|png)$/i.test(u));
  if (!best) throw new Error('no jpg/png asset');
  return { imageUrl: best, meta };
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download HTTP ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error('download too small');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return buf.length;
}

function upsertManifest(entry) {
  let list = [];
  if (fs.existsSync(manifestPath)) {
    list = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }
  const i = list.findIndex((x) => x.slug === entry.slug || x.filename === entry.filename);
  if (i >= 0) list[i] = { ...list[i], ...entry };
  else list.push(entry);
  fs.writeFileSync(manifestPath, JSON.stringify(list, null, 2));
}

function rebakeWeekly() {
  const r = spawnSync(
    process.execPath,
    ['scripts/bake-layouts.mjs'],
    {
      cwd: root,
      env: { ...process.env, MODE: 'nasaWeekly' },
      stdio: 'inherit',
    },
  );
  if (r.status !== 0) throw new Error(`bake failed status=${r.status}`);
}

const { key: weekKey } = isoWeek();
const force = process.env.FORCE === '1' || process.env.FORCE === 'true';

let state = {};
if (fs.existsSync(statePath)) {
  try { state = JSON.parse(fs.readFileSync(statePath, 'utf8')); } catch { state = {}; }
}

if (!force && state.weekKey === weekKey && fs.existsSync(outImage)) {
  console.log(JSON.stringify({
    skipped: true,
    reason: 'already fetched this ISO week',
    weekKey,
    slug: 'nasaWeekly',
    label: state.label || '本周 NASA / Weekly NASA',
    file: 'nasa/weekly-latest.jpg',
  }, null, 2));
  process.exit(0);
}

const query = pickQuery(weekKey);
console.log(`week=${weekKey} query="${query}"`);

const items = await searchNasa(query);
// rotate by week within results
const idx = createHash('sha1').update(weekKey + 'pick').digest()[0] % items.length;
let chosen = null;
let lastErr = null;
for (let k = 0; k < items.length; k++) {
  const item = items[(idx + k) % items.length];
  try {
    const { imageUrl, meta } = await resolveImageUrl(item);
    const nasaId = meta.nasa_id || item?.data?.[0]?.nasa_id || 'unknown';
    const title = meta.title || 'NASA Image';
    const bytes = await download(imageUrl, outImage);
    chosen = {
      filename: 'weekly-latest.jpg',
      nasa_id: nasaId || meta.nasa_id || 'unknown',
      slug: 'weekly-latest',
      mode_slug: 'nasaWeekly',
      label: `本周 NASA · ${title}`.slice(0, 80),
      title,
      image_url: imageUrl,
      source: 'https://images.nasa.gov/',
      weekKey,
      query,
      bytes,
    };
    break;
  } catch (e) {
    lastErr = e;
  }
}
if (!chosen) throw lastErr || new Error('failed to pick NASA image');

upsertManifest({
  filename: chosen.filename,
  nasa_id: chosen.nasa_id,
  slug: chosen.slug,
  label: chosen.label,
  image_url: chosen.image_url,
  source: chosen.source,
  weekKey: chosen.weekKey,
  query: chosen.query,
  mode: 'nasaWeekly',
});

fs.writeFileSync(statePath, JSON.stringify({
  weekKey,
  query,
  nasa_id: chosen.nasa_id,
  title: chosen.title,
  label: chosen.label,
  image_url: chosen.image_url,
  updatedAt: new Date().toISOString(),
}, null, 2));

console.log('saved', outImage, `(${chosen.bytes} bytes)`);
rebakeWeekly();

console.log(JSON.stringify({
  ok: true,
  weekKey,
  slug: 'nasaWeekly',
  label: chosen.label,
  query,
  nasa_id: chosen.nasa_id,
  file: 'public/refs/nasa/weekly-latest.jpg',
  layout: 'public/layouts/nasaWeekly.bin',
}, null, 2));
