import puppeteer from 'puppeteer-core';

const modes = [
  'spiral', 'nebulaArm', 'tunnel', 'blackHole',
  'splash', 'radialAura', 'mistMountains', 'emberStorm',
];
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--use-gl=angle', '--use-angle=swiftshader'],
});
const page = await browser.newPage();
await page.setViewport({ width: 720, height: 1280, deviceScaleFactor: 1 });
page.setDefaultTimeout(120000);
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
// Wait for preload + system ready
await page.waitForFunction(() => !!window.__particleMorph, { timeout: 90000 });
await new Promise((r) => setTimeout(r, 1500));

for (const m of modes) {
  await page.evaluate((mode) => {
    window.__particleMorph.setMode(mode, true);
  }, m);
  await new Promise((r) => setTimeout(r, 1600));
  const path = `/workspace/particle-morph/screenshots/${m}.png`;
  await page.screenshot({ path, type: 'png' });
  console.log('saved', path);
}
await browser.close();
