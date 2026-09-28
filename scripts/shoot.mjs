import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '..', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const BASE = process.env.URL || 'http://127.0.0.1:5173';
const MODES = ['spiral', 'nebulaArm', 'tunnel', 'blackHole', 'emberStorm', 'splash', 'radialAura', 'mistMountains'];
const ORBIT_MODES = ['spiral', 'tunnel', 'blackHole', 'nebulaArm', 'emberStorm'];

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || '/usr/bin/google-chrome',
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--use-gl=angle',
    '--use-angle=swiftshader',
  ],
  defaultViewport: { width: 900, height: 1600, deviceScaleFactor: 1 },
});

const page = await browser.newPage();
page.setDefaultNavigationTimeout(90000);
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__particleMorph != null, { timeout: 120000 });
await new Promise((r) => setTimeout(r, 2800));

for (const mode of MODES) {
  await page.evaluate((m) => {
    const s = window.__particleMorph;
    s.setAutoDemo(false);
    s.setMode(m, true);
    s.resetOrbit?.();
  }, mode);
  await new Promise((r) => setTimeout(r, 1000));
  const dest = path.join(outDir, `${mode}.png`);
  await page.screenshot({ path: dest, type: 'png' });
  console.log('shot', dest);

  if (ORBIT_MODES.includes(mode)) {
    await page.evaluate(() => window.__particleMorph.setOrbitOffset(28, 8));
    await new Promise((r) => setTimeout(r, 500));
    const destO = path.join(outDir, `${mode}-orbit.png`);
    await page.screenshot({ path: destO, type: 'png' });
    console.log('shot', destO);
    await page.evaluate(() => window.__particleMorph.resetOrbit());
  }
}

await browser.close();
console.log('done');
