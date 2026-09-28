import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '..', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const BASE = process.env.URL || 'http://127.0.0.1:5173';
const MODES = [
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
];

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader'],
  defaultViewport: { width: 900, height: 1600, deviceScaleFactor: 1 },
});

const page = await browser.newPage();
page.setDefaultNavigationTimeout(120000);
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__particleMorph != null, { timeout: 180000 });
await new Promise((r) => setTimeout(r, 3500));

for (const mode of MODES) {
  await page.evaluate((m) => {
    const s = window.__particleMorph;
    s.setAutoDemo(false);
    s.setMode(m, true);
    s.resetOrbit?.();
  }, mode);
  await new Promise((r) => setTimeout(r, 1100));
  // slug file: pinVortex → pin-vortex via kebab of remaining
  const slug = mode.replace(/^pin/, 'pin-').replace(/([A-Z])/g, (c, i) => (i ? '-' : '') + c.toLowerCase()).replace(/^-/, '');
  // simpler: pinVortex → pin-vortex
  const file = 'pin-' + mode.replace(/^pin/, '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() + '.png';
  const dest = path.join(outDir, file);
  await page.screenshot({ path: dest, type: 'png' });
  console.log('shot', dest, 'mode=', mode);
}

await browser.close();
console.log('done');
