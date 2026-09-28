import './style.css';
import { ParticleSystem } from './core/ParticleSystem';
import { createUI } from './ui/UI';
import { preloadImageLayouts } from './generators';

async function boot() {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) throw new Error('#app not found');

  const loading = document.createElement('div');
  loading.className = 'ui-panel';
  loading.style.left = '50%';
  loading.style.bottom = '50%';
  loading.style.transform = 'translate(-50%, 50%)';
  loading.textContent = '加载粒子布局…';
  app.appendChild(loading);

  try {
    await preloadImageLayouts();
  } catch (err) {
    console.error(err);
    loading.textContent = '布局加载失败，回退程序化生成';
    await new Promise((r) => setTimeout(r, 600));
  }
  loading.remove();

  const system = new ParticleSystem(app);
  createUI(app, system);
  system.start();
  (window as unknown as { __particleMorph: ParticleSystem }).__particleMorph = system;
}

boot();
