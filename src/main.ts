import './style.css';
import { ParticleSystem } from './core/ParticleSystem';
import { createUI } from './ui/UI';
import { preloadImageLayouts } from './generators';

/** Dense grainy starfield loader — matches particle-morph aesthetic (small/dense/varied). */
function createLoadingOverlay(app: HTMLElement): HTMLElement {
  const loading = document.createElement('div');
  loading.className = 'ui-loading';
  loading.setAttribute('role', 'status');
  loading.setAttribute('aria-live', 'polite');

  const COUNT = 110;
  const parts: string[] = [];
  // Deterministic-ish scatter via golden angle + layered radii (no Math.random in render loop)
  for (let i = 0; i < COUNT; i++) {
    const g = (i * 137.508) % 360;
    // Bias toward center: mix tight core + soft halo
    const layer = i % 5;
    const rBase =
      layer === 0 ? 4 + (i % 17) * 1.1 :
      layer === 1 ? 18 + (i % 23) * 1.4 :
      layer === 2 ? 36 + (i % 19) * 1.6 :
      layer === 3 ? 52 + (i % 13) * 1.8 :
      8 + ((i * 7) % 68);
    const radius = Math.min(78, rBase);
    // Mostly tiny (1–2px), few mid (2.5–3.5), rare larger spark (4px)
    const sizeRoll = (i * 17 + 3) % 100;
    const size =
      sizeRoll < 72 ? 1 + (i % 5) * 0.22 :
      sizeRoll < 92 ? 2.1 + (i % 4) * 0.28 :
      3.2 + (i % 3) * 0.35;
    const delay = ((i * 0.073) % 2.8).toFixed(3);
    const drift = (2.6 + (i % 11) * 0.28).toFixed(2);
    const twinkle = (1.1 + (i % 9) * 0.22).toFixed(2);
    const glow = (size * (0.9 + (i % 4) * 0.25)).toFixed(2);
    const opacity = (0.28 + ((i * 13) % 60) / 100).toFixed(2);
    const dx = ((((i * 29) % 21) - 10) * 0.35).toFixed(2);
    const dy = ((((i * 41) % 21) - 10) * 0.35).toFixed(2);
    parts.push(
      `<span class="star" style="--angle:${g.toFixed(2)}deg;--radius:${radius.toFixed(1)}px;--size:${size.toFixed(2)}px;--delay:${delay}s;--drift:${drift}s;--twinkle:${twinkle}s;--glow:${glow}px;--op:${opacity};--dx:${dx}px;--dy:${dy}px"></span>`,
    );
  }

  loading.innerHTML = `
    <div class="ui-loading-stars" aria-hidden="true">${parts.join('')}</div>
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
