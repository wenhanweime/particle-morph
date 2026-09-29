import './style.css';
import { ParticleSystem } from './core/ParticleSystem';
import { createUI } from './ui/UI';
import { preloadImageLayouts } from './generators';

function createLoadingOverlay(app: HTMLElement): HTMLElement {
  const loading = document.createElement('div');
  loading.className = 'ui-loading';
  loading.setAttribute('role', 'status');
  loading.setAttribute('aria-live', 'polite');

  // Explicit ring placements (avoid CSS calc modulo — invalidates transforms in some engines)
  const stars = [
    { angle: 0, radius: 0, size: 6, delay: 0 },
    { angle: 0, radius: 38, size: 4, delay: 0.1 },
    { angle: 30, radius: 48, size: 3, delay: 0.2 },
    { angle: 60, radius: 36, size: 5, delay: 0.05 },
    { angle: 90, radius: 52, size: 3, delay: 0.35 },
    { angle: 120, radius: 40, size: 4, delay: 0.15 },
    { angle: 150, radius: 56, size: 3, delay: 0.45 },
    { angle: 180, radius: 34, size: 5, delay: 0.25 },
    { angle: 210, radius: 46, size: 3, delay: 0.55 },
    { angle: 240, radius: 42, size: 4, delay: 0.3 },
    { angle: 270, radius: 54, size: 3, delay: 0.4 },
    { angle: 300, radius: 38, size: 5, delay: 0.2 },
    { angle: 330, radius: 50, size: 3, delay: 0.5 },
  ];

  const starsHtml = stars
    .map(
      (s) =>
        `<span class="star" style="--angle:${s.angle}deg;--radius:${s.radius}px;--size:${s.size}px;--delay:${s.delay}s"></span>`,
    )
    .join('');

  loading.innerHTML = `
    <div class="ui-loading-stars" aria-hidden="true">${starsHtml}</div>
    <div class="ui-loading-text">加载粒子布局…</div>
  `;
  app.appendChild(loading);
  return loading;
}

async function boot() {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) throw new Error('#app not found');

  const loading = createLoadingOverlay(app);

  try {
    await preloadImageLayouts();
  } catch (err) {
    console.error(err);
    const text = loading.querySelector('.ui-loading-text');
    if (text) text.textContent = '布局加载失败，回退程序化生成';
    await new Promise((r) => setTimeout(r, 600));
  }
  loading.remove();

  const system = new ParticleSystem(app);
  createUI(app, system);
  system.start();
  (window as unknown as { __particleMorph: ParticleSystem }).__particleMorph = system;
}

boot();
